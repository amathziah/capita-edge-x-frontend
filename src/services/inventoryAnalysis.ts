/**
 * Inventory Analysis Service
 * ==========================
 * Smart Forecasting Engine:
 * - Calculates sales velocity (30d avg)
 * - Predicts stockout dates
 * - Identifies "Dead Stock" (No sales > 60 days)
 * - Identifies "Fast Movers"
 */

import { supabase } from '../supabaseClient';
import { Decimal } from 'decimal.js';

export interface InventoryInsight {
    product_id: string;
    name: string;
    sku: string;
    current_stock: number;
    sales_velocity: number; // units/day
    days_remaining: number; // Infinity if velocity 0
    status: 'healthy' | 'dead_stock' | 'stockout_risk' | 'overstocked';
    action_needed?: string;
}

export class InventoryService {

    /**
     * Run full analysis on all products.
     * Queries Supabase directly. Handles missing forecasting columns gracefully.
     */
    static async analyzeInventoryHealth(): Promise<{
        insights: InventoryInsight[];
        summary: {
            cash_locked_in_dead_stock: number;
            stockout_risks: number;
            total_products: number;
            health_percent: number;
        }
    }> {

        // 0. Try to trigger the DB-side velocity calc (fails gracefully if RPC doesn't exist)
        const { error: rpcError } = await supabase.rpc('calculate_inventory_forecast');
        if (rpcError) console.warn("Analysis RPC unavailable (migration not applied yet):", rpcError.message);

        // 1. Fetch products — use columns we KNOW exist + optional new ones
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, sku, stock, cost_price, min_stock, sales_velocity_30d, last_sold_at, created_at');

        if (error) {
            console.warn("Inventory analysis query error:", error.message);
            // Return safe defaults
            return { insights: [], summary: { cash_locked_in_dead_stock: 0, stockout_risks: 0, total_products: 0, health_percent: 100 } };
        }
        if (!products || products.length === 0) {
            return { insights: [], summary: { cash_locked_in_dead_stock: 0, stockout_risks: 0, total_products: 0, health_percent: 100 } };
        }

        const insights: InventoryInsight[] = [];
        let cashLocked = new Decimal(0);
        let stockoutRisks = 0;
        let healthyCount = 0;

        const NOW = new Date();
        const SIXTY_DAYS_AGO = new Date(NOW.getTime() - 60 * 24 * 60 * 60 * 1000);

        for (const p of products) {
            const stock = p.stock ?? 0;
            const minStock = p.min_stock ?? 10;
            const velocity = p.sales_velocity_30d ?? 0;
            const cost = new Decimal(p.cost_price ?? 0);

            // Use last_sold_at if available, otherwise approximate from created_at
            const lastSold = p.last_sold_at ? new Date(p.last_sold_at) : null;
            const createdAt = p.created_at ? new Date(p.created_at) : NOW;

            // 1. Predict Stockout
            let daysRemaining = Infinity;
            if (velocity > 0) {
                daysRemaining = stock / velocity;
            }

            // 2. Identify Status
            let status: InventoryInsight['status'] = 'healthy';
            let action: string | undefined;

            // Dead Stock Logic:
            //   - If we have last_sold_at: Dead if > 60 days ago AND stock > 0
            //   - If we DON'T have last_sold_at: Dead if created > 90 days ago, no velocity, AND stock > 0
            let isDead = false;
            if (stock > 0) {
                if (lastSold) {
                    isDead = lastSold < SIXTY_DAYS_AGO;
                } else {
                    // Fallback: use created_at + velocity
                    const daysSinceCreation = (NOW.getTime() - createdAt.getTime()) / (1000 * 3600 * 24);
                    isDead = daysSinceCreation > 90 && velocity === 0;
                }
            }

            if (isDead) {
                status = 'dead_stock';
                action = 'Run Clearance Sale';
                cashLocked = cashLocked.plus(cost.mul(stock));
            }
            else if (daysRemaining < 7 && stock > 0) {
                status = 'stockout_risk';
                action = `Reorder ASAP (${Math.floor(daysRemaining)} days left)`;
                stockoutRisks++;
            }
            else if (stock > minStock * 3 && stock > 0) {
                status = 'overstocked';
                action = 'Reduce Orders';
            }
            else if (stock > 0) {
                healthyCount++;
            }

            insights.push({
                product_id: p.id,
                name: p.name,
                sku: p.sku ?? 'N/A',
                current_stock: stock,
                sales_velocity: velocity,
                days_remaining: daysRemaining,
                status,
                action_needed: action
            });
        }

        // Sort by "Urgency"
        insights.sort((a, b) => {
            const urgency = { stockout_risk: 0, dead_stock: 1, overstocked: 2, healthy: 3 };
            return urgency[a.status] - urgency[b.status];
        });

        // System Health: % of products that are "healthy" out of total with stock > 0
        const productsWithStock = products.filter(p => (p.stock ?? 0) > 0).length;
        const healthPercent = productsWithStock > 0
            ? Math.round((healthyCount / productsWithStock) * 100)
            : 100;

        return {
            insights,
            summary: {
                cash_locked_in_dead_stock: cashLocked.toNumber(),
                stockout_risks: stockoutRisks,
                total_products: products.length,
                health_percent: healthPercent
            }
        };
    }
}
