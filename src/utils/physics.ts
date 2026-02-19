import { Invoice } from '../types';

// Constants for Visual Layout
const BASE_GRAVITY = 1;

export enum NodeTier {
    TIER_1_CRITICAL = 1, // Large, Critical
    TIER_2_ACTIVE = 2,   // Medium, Standard
    TIER_3_PASSIVE = 3   // Small, Low Priority
}

export interface GridPosition {
    x: number;
    y: number;
    tier: NodeTier;
    zoneLabel: string;
}

/**
 * Calculates the Tier of an invoice based on amount and status.
 */
export const calculateNodeTier = (invoice: Invoice, totalCashFlow: number): NodeTier => {
    // 1. Critical Tier: Overdue, Escalated, or Very High Value (>10% of total flow)
    const isHighValue = totalCashFlow > 0 && (invoice.total / totalCashFlow) > 0.10;

    if (invoice.status === 'overdue' || invoice.status === 'escalated' || (isHighValue && invoice.status !== 'paid')) {
        return NodeTier.TIER_1_CRITICAL;
    }

    // 2. Passive Tier: Drafts, Paid, or very small amounts
    if (invoice.status === 'draft' || invoice.status === 'paid' || invoice.total < 5000) {
        return NodeTier.TIER_3_PASSIVE;
    }

    // 3. Active Tier: Everything else
    return NodeTier.TIER_2_ACTIVE;
};

/**
 * Determines the deterministic Grid Position for a node.
 * Uses a grid system: Row = index in list, Col = based on zone.
 */
export const calculateGridPosition = (
    invoice: Invoice,
    indexInZone: number,
    totalCashFlow: number
): GridPosition => {
    const tier = calculateNodeTier(invoice, totalCashFlow);
    const zoneInfo = getZoneForStatus(invoice.status);

    // Grid Constants
    // Tier 1 Width is 280px, Tier 2 is 220px. We need a cell that fits the largest.
    const GRID_CELL_WIDTH = 300;
    const GRID_CELL_HEIGHT = 160;

    // How many columns fit in this zone?
    const zoneWidth = zoneInfo.max - zoneInfo.min;

    // Force at least 1 column, but usually 2 if space permits (Active/Draft are 600px wide)
    const COLS_PER_ZONE = Math.max(1, Math.floor(zoneWidth / GRID_CELL_WIDTH));

    // Calculate Grid Layout
    const row = Math.floor(indexInZone / COLS_PER_ZONE);
    const col = indexInZone % COLS_PER_ZONE;

    // Calculate Absolute Position
    // Center the grid block within the zone
    const actualGridWidth = COLS_PER_ZONE * GRID_CELL_WIDTH;
    const paddingX = (zoneWidth - actualGridWidth) / 2;

    const startX = zoneInfo.min + paddingX;

    // Center the Node within its Cell
    // We add half the cell width minus half the potential max node width to keep it roughly centered visually?
    // Actually, just placing at top-left of cell + small pad is safer for alignment.
    const x = startX + (col * GRID_CELL_WIDTH) + 20; // +20 internal cell padding
    const y = 150 + (row * GRID_CELL_HEIGHT);

    return { x, y, tier, zoneLabel: zoneInfo.label };
};

/**
 * Determines the X-Axis Zone for a node based on its status.
 * Horizontal Layout: Clients -> Draft -> Sent -> Overdue -> Paid
 */
export const getZoneForStatus = (status: Invoice['status']): { min: number, max: number, label: string } => {
    // Canvas Segments (Fixed 500px width per zone roughly)
    switch (status) {
        case 'draft':
            return { min: 0, max: 600, label: 'Drafts' };
        case 'sent':
        case 'viewed':
        case 'partially_paid':
            return { min: 600, max: 1200, label: 'Active Process' };
        case 'overdue':
        case 'escalated':
            return { min: 1200, max: 1800, label: 'Attention Needed' };
        case 'paid':
            return { min: 1800, max: 2400, label: 'Completed' };
        default:
            return { min: 600, max: 1200, label: 'Active' };
    }
};

/**
 * Identifies "Mandatory Missions" - top critical items.
 */
export const getMandatoryMissions = (invoices: Invoice[]): Invoice[] => {
    const totalCashFlow = invoices.reduce((sum, inv) => sum + inv.total, 0);

    // Prioritize by Tier 1, then Amount
    return invoices
        .filter(inv => calculateNodeTier(inv, totalCashFlow) === NodeTier.TIER_1_CRITICAL)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
};
