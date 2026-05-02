import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  UserPlus,
  FileText,
  Bell,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { InvoiceDocumentPreview } from '../../invoices/components/InvoiceDocumentPreview';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'create_customer' | 'create_invoice_draft' | 'send_reminder';

interface ActionPayload {
  type: ActionType;
  args: Record<string, any>;   // What the AI is about to do
  result?: Record<string, any>; // What already happened (post-execution)
  status?: 'pending' | 'done' | 'error'; // 'pending' = needs approval, 'done' = already executed
}

interface AIActionApprovalCardProps {
  action: ActionPayload;
  onApprove: (action: ActionPayload) => void;
  onReject: (action: ActionPayload) => void;
}

// ─── Config per action type ────────────────────────────────────────────────────

const ACTION_CONFIG: Record<ActionType, {
  icon: React.ElementType;
  label: string;
  description: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
}> = {
  create_customer: {
    icon: UserPlus,
    label: 'Create Customer',
    description: 'The AI wants to add a new customer record to your CRM.',
    accent: '#3B82F6',
    accentBg: 'rgba(59,130,246,0.08)',
    accentBorder: 'rgba(59,130,246,0.2)',
  },
  create_invoice_draft: {
    icon: FileText,
    label: 'Draft Invoice',
    description: 'The AI wants to create a draft invoice in your system.',
    accent: '#14B8B8',
    accentBg: 'rgba(20,184,184,0.08)',
    accentBorder: 'rgba(20,184,184,0.2)',
  },
  send_reminder: {
    icon: Bell,
    label: 'Send Reminder',
    description: 'The AI wants to queue a collection reminder email.',
    accent: '#F59E0B',
    accentBg: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.2)',
  },
};

// ─── Field renderers ─────────────────────────────────────────────────────────

function DataRow({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-[11.5px] font-medium text-gray-400 shrink-0 pt-px">{label}</span>
      <span className="text-[12.5px] font-semibold text-gray-800 text-right min-w-0 break-words">
        {String(value)}
      </span>
    </div>
  );
}

function ActionPreview({ type, args, result }: {
  type: ActionType;
  args?: Record<string, any>;
  result?: Record<string, any>;
}) {
  // Normalize: backend returns result (DB response), not original args.
  // We read from result first, falling back to args if provided.
  const a = args || {};
  const r = result || {};

  if (type === 'create_customer') {
    const name    = r.customer?.name    || a.name;
    const email   = r.customer?.email   || a.email;
    const phone   = r.customer?.phone   || a.phone;
    const address = r.customer?.address || a.address;
    return (
      <>
        <DataRow label="Name"    value={name} />
        <DataRow label="Email"   value={email} />
        <DataRow label="Phone"   value={phone} />
        <DataRow label="Address" value={address} />
        {r.customer?.id && <DataRow label="ID" value={r.customer.id} />}
      </>
    );
  }
  if (type === 'create_invoice_draft') {
    const customer = r.invoice?.buyer?.name || a.customerName || a.customerId;
    const amount   = r.invoice?.total       || a.amount;
    const desc     = r.invoice?.items?.[0]?.description || a.description;
    const invNum   = r.invoice?.invoiceNumber;
    return (
      <>
        <DataRow label="Customer"    value={customer} />
        <DataRow label="Amount"      value={amount ? `₹${Number(amount).toLocaleString('en-IN')}` : undefined} />
        <DataRow label="Description" value={desc} />
        {invNum && <DataRow label="Invoice #" value={invNum} />}
        <DataRow label="Status"      value="Draft" />
      </>
    );
  }
  if (type === 'send_reminder') {
    const customer = a.customerName || r.customerName;
    const invNum   = a.invoiceNumber || r.invoiceNumber;
    return (
      <>
        <DataRow label="Customer"  value={customer} />
        <DataRow label="Invoice #" value={invNum} />
        <DataRow label="Channel"   value="Email" />
        <DataRow label="Type"      value="Collection Reminder" />
      </>
    );
  }
  return null;
}

// ─── Mapping Helpers for Document Preview ─────────────────────────────────────

function mapInvoiceForPreview(inv: any) {
  const org = inv.organization || {};
  // organization_settings is joined as org.settings or the org record itself has owner_name
  const settings = org.settings || org;
  const sellerName =
    settings.owner_name ||
    settings.businessName ||
    settings.business_name ||
    org.name ||
    'Your Business';
  const sellerAddress =
    settings.address ||
    settings.location ||
    org.address ||
    undefined;

  return {
    invoiceNumber: inv.invoiceNumber,
    date: inv.date,
    dueDate: inv.dueDate,
    fromName: sellerName,
    fromAddress: sellerAddress,
    fromGstin: settings.gstin || org.gstin,
    customerName: inv.buyer?.name || inv.buyer?.email?.split('@')[0],
    customerEmail: inv.buyer?.email,
    customerAddress: inv.buyer?.address,
    isGstRegistered: !!(settings.gstin || org.gstin),
    items: (inv.items || []).map((it: any) => ({
      description: it.description,
      quantity: it.quantity,
      price: it.price,
    })),
  };
}

function getCalcResult(inv: any) {
  const total = Number(inv.total || 0);
  return {
    subtotal: String(total),
    total_tax: "0",
    total_discount: "0",
    grand_total: String(total),
    payable_amount: String(total),
    tds_amount: "0",
    shipping_charges: "0",
  };
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({ type, result, config }: {
  type: ActionType;
  result: Record<string, any>;
  config: typeof ACTION_CONFIG[ActionType];
}) {
  const Icon = config.icon;
  const messages: Record<ActionType, string> = {
    create_customer: `Customer "${result?.customer?.name || 'New Customer'}" has been added to your CRM.`,
    create_invoice_draft: `Draft invoice ${result?.invoice?.invoiceNumber || ''} has been created successfully.`,
    send_reminder: result?.message || 'Collection reminder has been queued.',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 py-6 px-4 text-center"
    >
      {/* Animated Success Badge */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: config.accentBg, border: `1.5px solid ${config.accentBorder}` }}
      >
        <Icon size={28} style={{ color: config.accent }} strokeWidth={1.8} />
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 12 }}
          className="absolute -right-2 -bottom-2 flex h-7 w-7 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-200"
        >
          <CheckCircle2 size={16} className="text-white" strokeWidth={2.5} />
        </motion.div>
      </motion.div>

      <div>
        <div className="text-[15px] font-bold text-gray-900">Success!</div>
        <p className="mt-1 text-[12px] leading-[1.6] text-gray-500 max-w-[280px]">
          {messages[type]}
        </p>
      </div>

      {/* Rich Preview Box */}
      {type === 'create_invoice_draft' && result.invoice && (
        <div className="w-full mt-2 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50 bg-gray-50/50">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Generated Invoice Preview
            </span>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-green-600 uppercase">Live Preview</span>
            </div>
          </div>
          
          <div className="max-h-[420px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <InvoiceDocumentPreview 
              invoice={mapInvoiceForPreview(result.invoice)}
              calcResult={getCalcResult(result.invoice)}
            />
          </div>
        </div>
      )}

      {type === 'create_customer' && result.customer && (
        <div className="w-full mt-2 rounded-xl border border-gray-100 bg-[#fbfcfd] p-4 text-left shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Customer Record Details
            </span>
            <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">
              LIVE
            </span>
          </div>
          
          <div className="space-y-2.5">
            <div className="flex justify-between">
              <span className="text-[11px] text-gray-400">Legal Name</span>
              <span className="text-[11px] font-bold text-gray-700">{result.customer.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-gray-400">Email Address</span>
              <span className="text-[11px] font-bold text-gray-700">{result.customer.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-gray-400">Customer ID</span>
              <span className="text-[10px] font-mono font-medium text-gray-400">{result.customer.id}</span>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AIActionApprovalCard({ action, onApprove, onReject }: AIActionApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [phase, setPhase] = useState<'preview' | 'approving' | 'done' | 'rejected'>(
    action.status === 'done' ? 'done' : 'preview'
  );

  const config = ACTION_CONFIG[action.type] || ACTION_CONFIG.create_customer;
  const Icon = config.icon;

  const handleApprove = async () => {
    setIsApproving(true);
    setPhase('approving');
    await new Promise((r) => setTimeout(r, 600)); // let animation breathe
    onApprove(action);
    setPhase('done');
    setIsApproving(false);
  };

  const handleReject = () => {
    setIsRejecting(true);
    setTimeout(() => {
      setPhase('rejected');
      setIsRejecting(false);
      onReject(action);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl border bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.12),0_1px_4px_-1px_rgba(0,0,0,0.06)]"
      style={{ borderColor: config.accentBorder }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 border-b"
        style={{
          background: config.accentBg,
          borderColor: config.accentBorder,
        }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          style={{ background: config.accentBg, border: `1.5px solid ${config.accentBorder}` }}
        >
          <Icon size={15} style={{ color: config.accent }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-gray-900 leading-none">{config.label}</div>
          <div className="mt-0.5 text-[11px] text-gray-500 leading-none truncate">{config.description}</div>
        </div>
        <div
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold"
          style={{
            background: 'rgba(20,184,184,0.1)',
            color: '#0E8A8A',
            border: '1px solid rgba(20,184,184,0.2)'
          }}
        >
          <Sparkles size={9} />
          AI Action
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Approval warning banner */}
        {phase === 'preview' && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border-b border-amber-100"
          >
            <AlertTriangle size={12} className="text-amber-500 shrink-0" />
            <span className="text-[11px] text-amber-700 font-medium">
              Review before execution — this action will modify your data.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Body */}
      <div className="px-4">
        <AnimatePresence mode="wait">
          {(phase === 'preview' || phase === 'approving') && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {/* Data preview */}
              <div className="py-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-300 pt-3 pb-1">
                  Action Details
                </div>
                <ActionPreview type={action.type} args={action.args} result={action.result} />
              </div>

              {/* Approve / Reject */}
              {phase === 'preview' && (
                <div className="flex gap-2.5 pb-4 pt-2">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving || isRejecting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-60"
                    style={{
                      background: `linear-gradient(135deg, ${config.accent} 0%, ${config.accent}cc 100%)`,
                      boxShadow: `0 4px 14px -2px ${config.accent}55`,
                    }}
                  >
                    {isApproving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {isApproving ? 'Executing…' : 'Approve & Execute'}
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isApproving || isRejecting}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] font-semibold text-gray-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Reject
                  </button>
                </div>
              )}

              {/* Executing loading state */}
              {phase === 'approving' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 pb-5 pt-2"
                >
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                  <span className="text-[12px] text-gray-400">Executing action…</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {phase === 'done' && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SuccessState type={action.type} result={action.result || {}} config={config} />
            </motion.div>
          )}

          {phase === 'rejected' && (
            <motion.div
              key="rejected"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 py-8 px-4 text-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50">
                <XCircle size={22} className="text-gray-400" />
              </div>
              <div className="text-[13px] font-semibold text-gray-700">Action Rejected</div>
              <p className="text-[11.5px] text-gray-400 max-w-[220px]">
                The action was cancelled. Your data was not modified.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer trace */}
      {(phase === 'preview' || phase === 'approving') && (
        <div
          className="flex items-center gap-1.5 border-t px-4 py-2"
          style={{ borderColor: config.accentBorder, background: config.accentBg }}
        >
          <span className="text-[10px] text-gray-400">Powered by</span>
          <span className="text-[10px] font-bold" style={{ color: config.accent }}>Capita AI</span>
          <ChevronRight size={9} className="text-gray-300" />
          <span className="text-[10px] text-gray-400">Deterministic Action Registry</span>
        </div>
      )}
    </motion.div>
  );
}
