import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, Terminal, Loader2, ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'create_customer' | 'create_invoice_draft' | 'send_reminder';

interface ExecutionStep {
  id: string;
  label: string;
  detail?: string;
  status: 'pending' | 'running' | 'done' | 'error';
  delay: number; // ms from terminal open
}

interface AIExecutionTerminalProps {
  action: {
    type: ActionType;
    result?: Record<string, any>;
    args?: Record<string, any>;
    status?: string;
  };
  onDismiss: () => void;
}

// ─── Step definitions per action type ────────────────────────────────────────

function buildSteps(type: ActionType, args: Record<string, any>, result: Record<string, any>): ExecutionStep[] {
  const base: Record<ActionType, ExecutionStep[]> = {
    create_customer: [
      { id: 'parse',    label: 'Parsing intent',           detail: '"create customer"',                           status: 'pending', delay: 0 },
      { id: 'validate', label: 'Validating input fields',  detail: `name="${args.name || result?.customer?.name || 'Customer'}"`, status: 'pending', delay: 400 },
      { id: 'dedup',    label: 'Checking for duplicates',  detail: 'querying customers table',                   status: 'pending', delay: 900 },
      { id: 'insert',   label: 'Writing to database',      detail: 'INSERT INTO customers',                      status: 'pending', delay: 1500 },
      { id: 'done',     label: 'Customer created',         detail: result?.customer?.id ? `id=${result.customer.id.slice(0, 8)}…` : 'success', status: 'pending', delay: 2000 },
    ],
    create_invoice_draft: [
      { id: 'parse',    label: 'Parsing intent',           detail: '"create invoice draft"',                     status: 'pending', delay: 0 },
      { id: 'customer', label: 'Resolving customer',       detail: `"${args.customerName || result?.invoice?.buyer?.name || 'Customer'}"`, status: 'pending', delay: 500 },
      { id: 'number',   label: 'Generating invoice number',detail: result?.invoice?.invoiceNumber || 'INV-DRAFT-…', status: 'pending', delay: 1000 },
      { id: 'tax',      label: 'Calculating tax & totals', detail: result?.invoice?.total ? `total=₹${Number(result.invoice.total).toLocaleString('en-IN')}` : 'computing', status: 'pending', delay: 1500 },
      { id: 'insert',   label: 'Writing to database',      detail: 'INSERT INTO invoices + invoice_items',       status: 'pending', delay: 2100 },
      { id: 'done',     label: 'Draft invoice created',    detail: 'status=draft',                               status: 'pending', delay: 2700 },
    ],
    send_reminder: [
      { id: 'parse',    label: 'Parsing intent',           detail: '"send collection reminder"',                 status: 'pending', delay: 0 },
      { id: 'customer', label: 'Looking up customer',      detail: `"${args.customerName || 'Customer'}"`,       status: 'pending', delay: 450 },
      { id: 'invoice',  label: 'Finding overdue invoice',  detail: 'status=overdue ORDER BY dueDate',            status: 'pending', delay: 900 },
      { id: 'validate', label: 'Validating invoice status',detail: 'confirmed overdue',                          status: 'pending', delay: 1300 },
      { id: 'queue',    label: 'Queueing reminder email',  detail: 'channel=email',                              status: 'pending', delay: 1800 },
      { id: 'done',     label: 'Reminder dispatched',      detail: 'success',                                    status: 'pending', delay: 2300 },
    ],
  };
  return base[type] || base.create_customer;
}

// ─── Individual terminal line ─────────────────────────────────────────────────

function TerminalLine({ step, index }: { step: ExecutionStep; index: number }) {
  const prefix =
    step.status === 'done'  ? '✓' :
    step.status === 'error' ? '✗' :
    step.status === 'running' ? '▶' : '·';

  const prefixColor =
    step.status === 'done'    ? '#22C55E' :
    step.status === 'error'   ? '#EF4444' :
    step.status === 'running' ? '#14B8B8' : 'rgba(255,255,255,0.2)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex items-baseline gap-3 py-[3px] font-mono text-[12.5px] leading-[1.8]"
    >
      {/* Line number */}
      <span className="shrink-0 w-5 text-right text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Status prefix */}
      <span className="shrink-0 w-3 text-center" style={{ color: prefixColor }}>
        {step.status === 'running' ? (
          <Loader2 size={10} className="inline animate-spin" style={{ color: '#14B8B8' }} />
        ) : prefix}
      </span>

      {/* Label */}
      <span style={{ color: step.status === 'pending' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)' }}>
        {step.label}
      </span>

      {/* Detail (muted, to the right) */}
      {step.detail && step.status !== 'pending' && (
        <span
          className="ml-auto shrink-0 text-[11px] pl-4 truncate max-w-[200px]"
          style={{ color: step.status === 'done' ? '#22C55E' : step.status === 'error' ? '#EF4444' : '#14B8B8' }}
        >
          {step.detail}
        </span>
      )}
    </motion.div>
  );
}

// ─── Main Terminal Component ──────────────────────────────────────────────────

const ACTION_META: Record<ActionType, { label: string; command: string }> = {
  create_customer:     { label: 'Create Customer',    command: 'capita run create_customer' },
  create_invoice_draft:{ label: 'Draft Invoice',      command: 'capita run create_invoice_draft' },
  send_reminder:       { label: 'Send Reminder',      command: 'capita run send_reminder' },
};

export function AIExecutionTerminal({ action, onDismiss }: AIExecutionTerminalProps) {
  const type = action.type as ActionType;
  const meta = ACTION_META[type] || ACTION_META.create_customer;
  const args = action.args || {};
  const result = action.result || {};

  const [steps, setSteps] = useState<ExecutionStep[]>(() => buildSteps(type, args, result));
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Animate each step sequentially
  useEffect(() => {
    if (action.status === 'done') {
      // Backend already executed — replay animation then mark all done
      const timers: ReturnType<typeof setTimeout>[] = [];

      steps.forEach((step, i) => {
        // Mark as "running"
        timers.push(setTimeout(() => {
          setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
          setCurrentStep(i);
        }, step.delay));

        // Mark as "done"
        timers.push(setTimeout(() => {
          setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s));
        }, step.delay + 320));
      });

      const finalDelay = steps[steps.length - 1].delay + 500;
      timers.push(setTimeout(() => {
        setIsComplete(true);
        // auto-scroll
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }, finalDelay));

      return () => timers.forEach(clearTimeout);
    }
  }, []);

  // Auto-scroll as lines appear
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [currentStep]);

  const visibleSteps = steps.filter(s => s.status !== 'pending' || steps.indexOf(s) <= currentStep);

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: minimized ? 'calc(100% - 48px)' : 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 260 }}
      className="absolute bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl overflow-hidden"
      style={{
        background: '#0d1117',
        border: '1px solid rgba(255,255,255,0.08)',
        borderBottom: 'none',
        boxShadow: '0 -8px 40px -8px rgba(0,0,0,0.6), 0 -2px 12px -2px rgba(20,184,184,0.15)',
        maxHeight: '54vh',
      }}
    >
      {/* Terminal title bar */}
      <div
        className="flex h-12 shrink-0 items-center gap-3 px-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.07)', background: '#161b22' }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className="h-3 w-3 rounded-full bg-[#FF5F57] hover:brightness-90 transition-all"
            title="Close"
          />
          <button
            type="button"
            onClick={() => setMinimized(v => !v)}
            className="h-3 w-3 rounded-full bg-[#FEBC2E] hover:brightness-90 transition-all"
            title="Minimize"
          />
          <div className="h-3 w-3 rounded-full bg-[#28C840] opacity-40" />
        </div>

        {/* Command shown */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <Terminal size={12} style={{ color: '#14B8B8' }} className="shrink-0" />
          <span className="font-mono text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <span style={{ color: '#14B8B8' }}>~</span>{' '}
            <span style={{ color: 'rgba(255,255,255,0.85)' }}>{meta.command}</span>
          </span>
        </div>

        {/* Status badge */}
        <div
          className="shrink-0 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold"
          style={{
            background: isComplete ? 'rgba(34,197,94,0.12)' : 'rgba(20,184,184,0.12)',
            color: isComplete ? '#22C55E' : '#14B8B8',
            border: `1px solid ${isComplete ? 'rgba(34,197,94,0.2)' : 'rgba(20,184,184,0.2)'}`,
          }}
        >
          {isComplete ? (
            <><CheckCircle2 size={9} /> DONE</>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-[#14B8B8] animate-pulse inline-block" /> RUNNING</>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMinimized(v => !v)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md hover:bg-white/5 transition-all ml-1"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <ChevronDown size={13} className={minimized ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s' }} />
        </button>
      </div>

      {/* Terminal body */}
      <div
        ref={bodyRef}
        className="flex-1 overflow-y-auto px-4 pt-3 pb-4"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
      >
        {/* Execution steps */}
        <AnimatePresence>
          {visibleSteps.map((step, i) => (
            <TerminalLine key={step.id} step={step} index={i} />
          ))}
        </AnimatePresence>

        {/* Completion summary */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.22 }}
              className="mt-4 rounded-xl p-3.5 font-mono"
              style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={13} style={{ color: '#22C55E' }} />
                <span className="text-[12px] font-bold" style={{ color: '#22C55E' }}>
                  {meta.label} — Execution Complete
                </span>
              </div>
              <div className="space-y-1">
                {action.type === 'create_customer' && result?.customer && (
                  <>
                    <TerminalOutputLine k="customer.name" v={result.customer.name} />
                    <TerminalOutputLine k="customer.id"   v={result.customer.id?.slice(0, 16) + '…'} />
                    {result.customer.email && <TerminalOutputLine k="customer.email" v={result.customer.email} />}
                  </>
                )}
                {action.type === 'create_invoice_draft' && result?.invoice && (
                  <>
                    <TerminalOutputLine k="invoice.number" v={result.invoice.invoiceNumber} />
                    <TerminalOutputLine k="invoice.status" v="draft" />
                    {result.invoice.total != null && (
                      <TerminalOutputLine k="invoice.total" v={`₹${Number(result.invoice.total).toLocaleString('en-IN')}`} />
                    )}
                  </>
                )}
                {action.type === 'send_reminder' && (
                  <>
                    <TerminalOutputLine k="status"  v="dispatched" />
                    <TerminalOutputLine k="channel" v="email" />
                    <TerminalOutputLine k="time"    v={new Date().toLocaleTimeString('en-IN')} />
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={onDismiss}
                className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all hover:brightness-110"
                style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                <XCircle size={11} />
                Dismiss terminal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function TerminalOutputLine({ k, v }: { k: string; v: any }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[11.5px]">
      <span style={{ color: 'rgba(255,255,255,0.3)' }}>{k}:</span>
      <span style={{ color: '#22C55E' }}>{String(v ?? '')}</span>
    </div>
  );
}
