/**
 * Collections API — Calls real backend endpoints.
 *
 * Endpoints:
 *   POST /api/ai/collections/generate-draft
 *   POST /api/ai/collections/send
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface CollectionDraft {
    subject: string;
    body: string;
    strategy: string;
    strategyTone: 'friendly' | 'direct' | 'urgent';
    daysOverdue: number;
}

export interface SendResult {
    success: boolean;
    sentAt: string;
}

// ---------------------------------------------------------------------------
// Email Template Strategies (used as fallback if backend is unavailable)
// ---------------------------------------------------------------------------
const STRATEGIES: Record<string, { strategy: string; tone: 'friendly' | 'direct' | 'urgent'; subject: string; body: string }> = {
    gentle: {
        strategy: 'Polite Nudge — Invoice is only slightly past due',
        tone: 'friendly',
        subject: 'Friendly Reminder: Invoice #{id} is past due',
        body: `Hi {customer},\n\nJust a quick reminder that Invoice #{id} for {amount} was due on {dueDate}. We understand things get busy — if you've already sent the payment, please disregard this note.\n\nIf you need any help or have questions, feel free to reach out.\n\nBest regards,\n{sender}`,
    },
    firm: {
        strategy: 'Firm Reminder — Invoice is 7-14 days overdue',
        tone: 'direct',
        subject: 'Action Required: Invoice #{id} is overdue',
        body: `Dear {customer},\n\nThis is a follow-up regarding Invoice #{id} totaling {amount}, which was due on {dueDate}. Our records show this payment is still outstanding.\n\nPlease arrange payment at your earliest convenience to avoid any service interruptions. If there's an issue we can help resolve, let us know.\n\nThank you for your prompt attention.\n\n{sender}`,
    },
    escalation: {
        strategy: 'Escalation — Invoice is critically overdue (14+ days)',
        tone: 'urgent',
        subject: 'Urgent: Invoice #{id} requires immediate payment',
        body: `Dear {customer},\n\nDespite our previous reminders, Invoice #{id} for {amount} (due {dueDate}) remains unpaid. This matter is now being escalated.\n\nTo avoid further action, please process this payment within 48 hours. If you believe there's been an error, contact us immediately.\n\nThank you,\n{sender}`,
    },
};

function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('sb-access-token');
    const organizationId = localStorage.getItem('sb-org-id');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (organizationId) headers['X-Organization-ID'] = organizationId;
    return headers;
}

function pickFallbackStrategy(daysOverdue: number): typeof STRATEGIES[string] {
    if (daysOverdue > 14) return STRATEGIES.escalation;
    if (daysOverdue > 7) return STRATEGIES.firm;
    return STRATEGIES.gentle;
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/**
 * Generate a draft email for an overdue invoice.
 * Tries the real backend first, falls back to local templates if unavailable.
 */
export async function generateDraft(
    invoiceId: string,
    forceAggressive = false,
    invoiceData?: { customerName?: string; amount?: number; dueDate?: string; daysOverdue?: number }
): Promise<CollectionDraft> {
    try {
        const res = await fetch(`${API_URL}/ai/collections/generate-draft`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ invoiceId, forceAggressive }),
        });

        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        // Backend unavailable, use local fallback
    }

    // Fallback: use local templates with actual invoice data
    const daysOverdue = invoiceData?.daysOverdue || 0;
    const strat = forceAggressive ? STRATEGIES.escalation : pickFallbackStrategy(daysOverdue);

    return {
        subject: strat.subject.replace('{id}', invoiceId.slice(-6)),
        body: strat.body
            .replace(/{id}/g, invoiceId.slice(-6))
            .replace(/{customer}/g, invoiceData?.customerName || 'Valued Customer')
            .replace(/{amount}/g, invoiceData?.amount ? `₹${invoiceData.amount.toLocaleString()}` : '—')
            .replace(/{dueDate}/g, invoiceData?.dueDate || '—')
            .replace(/{sender}/g, 'Your Finance Team'),
        strategy: strat.strategy,
        strategyTone: strat.tone,
        daysOverdue,
    };
}

/**
 * Send a reminder email via the backend.
 * Tries the real backend first; returns error if backend is unavailable.
 */
export async function sendReminder(
    invoiceId: string,
    draft: { subject: string; body: string }
): Promise<SendResult> {
    try {
        const res = await fetch(`${API_URL}/ai/collections/send`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ invoiceId, ...draft }),
        });

        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        // Backend unavailable
    }

    return {
        success: false,
        sentAt: new Date().toISOString(),
    };
}
