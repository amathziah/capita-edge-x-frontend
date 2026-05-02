import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  Workflow,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Mail,
  AlertTriangle,
  Send,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ─── Types ──────────────────────────────────────────────────────────────────

type StepKind = 'tool' | 'llm' | 'approval' | 'mutation';
type StepStatus = 'pending' | 'completed' | 'failed' | 'skipped' | 'awaiting_approval';

interface PlanStep {
  id: string;
  kind: StepKind;
  label: string;
  status: StepStatus;
  tool?: string;
  result?: any;
  error?: string;
  approvalRequired?: boolean;
}

interface Draft {
  id: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  currency?: string;
  daysOverdue: number;
  reliability?: string;
  subject?: string;
  message: string;
}

interface Skill {
  id: string;
  label: string;
  description: string;
  rationale?: string;
  status: string;
  summary: string;
  steps: PlanStep[];
  drafts?: Draft[];
  narrative?: string | null;
  recommendation?: string | null;
  requiresApproval: boolean;
}

interface Props {
  skill: Skill;
  onApproveAll?: (approvedDraftIds: string[]) => void;
  onApproveOne?: (draftId: string) => void;
  onRejectAll?: () => void;
}

// ─── Step row ───────────────────────────────────────────────────────────────

function statusIcon(status: StepStatus) {
  if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === 'failed') return <XCircle size={14} className="text-red-500" />;
  if (status === 'awaiting_approval') return <ShieldAlert size={14} className="text-amber-500" />;
  if (status === 'skipped') return <Circle size={14} className="text-gray-300" />;
  return <Loader2 size={14} className="animate-spin text-gray-300" />;
}

function StepRow({ step }: { step: PlanStep }) {
  return (
    <li className="flex items-start gap-2.5 py-1.5">
      <span className="mt-0.5 shrink-0">{statusIcon(step.status)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-[12.5px] ${
              step.status === 'completed'
                ? 'text-gray-700'
                : step.status === 'awaiting_approval'
                ? 'font-semibold text-amber-700'
                : step.status === 'failed'
                ? 'text-red-600'
                : step.status === 'skipped'
                ? 'text-gray-300 line-through'
                : 'text-gray-400'
            }`}
          >
            {step.label}
          </span>
          {step.kind === 'mutation' && (
            <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600">
              Side-effect
            </span>
          )}
          {step.kind === 'llm' && (
            <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-violet-600">
              LLM
            </span>
          )}
        </div>
        {step.error && (
          <div className="mt-0.5 text-[11px] text-red-500">{step.error}</div>
        )}
      </div>
    </li>
  );
}

// ─── Draft row ──────────────────────────────────────────────────────────────

function DraftRow({
  draft,
  approved,
  onToggle,
}: {
  draft: Draft;
  approved: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const fmt = (n: number) =>
    `${draft.currency || ''} ${Math.round(n || 0).toLocaleString()}`.trim();

  const reliabilityColor =
    draft.reliability === 'reliable'
      ? 'text-emerald-600 bg-emerald-50'
      : draft.reliability === 'slow' || draft.reliability === 'irregular'
      ? 'text-red-600 bg-red-50'
      : 'text-gray-500 bg-gray-50';

  return (
    <div
      className={`rounded-xl border transition-all ${
        approved ? 'border-primary/30 bg-primary/[0.03]' : 'border-gray-100 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
            approved
              ? 'border-primary bg-primary text-white'
              : 'border-gray-300 hover:border-primary'
          }`}
        >
          {approved && <CheckCircle2 size={12} />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[12.5px] font-bold text-gray-900 truncate">
              {draft.customerName}
            </span>
            <span className="text-[11px] text-gray-400">·</span>
            <span className="text-[11px] text-gray-500">{draft.invoiceNumber}</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${reliabilityColor}`}
            >
              {draft.reliability || 'unknown'}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-gray-700">{fmt(draft.amount)}</span>
            <span className="text-gray-300">·</span>
            <span className="text-amber-600">
              {draft.daysOverdue} days overdue
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 text-gray-400 hover:text-gray-600"
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-50 bg-gray-50/50"
          >
            <div className="space-y-2 px-3 py-3">
              {draft.subject && (
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    Subject
                  </div>
                  <div className="text-[12px] font-semibold text-gray-700">{draft.subject}</div>
                </div>
              )}
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Message
                </div>
                <p className="whitespace-pre-wrap text-[12px] leading-[1.6] text-gray-700">
                  {draft.message}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main card ──────────────────────────────────────────────────────────────

export function AISkillPlanCard({ skill, onApproveAll, onApproveOne, onRejectAll }: Props) {
  const [approved, setApproved] = useState<Set<string>>(
    () => new Set((skill.drafts || []).map((d) => d.id)),
  );
  const [stepsOpen, setStepsOpen] = useState(false);
  const [phase, setPhase] = useState<'review' | 'sending' | 'done' | 'rejected'>('review');

  const drafts = skill.drafts || [];
  const hasDrafts = drafts.length > 0;
  const approvedCount = approved.size;
  const requiresApproval = skill.requiresApproval && hasDrafts;

  const toggleDraft = (id: string) => {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApproveAll = async () => {
    setPhase('sending');
    await new Promise((r) => setTimeout(r, 500));
    onApproveAll?.([...approved]);
    setPhase('done');
  };

  const handleReject = () => {
    setPhase('rejected');
    onRejectAll?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.1),0_1px_4px_-1px_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gradient-to-br from-violet-50/60 via-primary-light/30 to-white px-4 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-white">
          <Workflow size={16} className="text-primary" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-gray-900 leading-none">
              {skill.label}
            </span>
            <span className="rounded-full border border-primary/30 bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
              <Sparkles size={8} className="mr-0.5 inline" />
              Skill
            </span>
          </div>
          <div className="mt-1 text-[11px] leading-[1.5] text-gray-500">
            {skill.description}
          </div>
        </div>
      </div>

      {/* Plan steps (collapsible) */}
      <div className="border-b border-gray-50">
        <button
          type="button"
          onClick={() => setStepsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Plan
            </span>
            <span className="text-[11px] text-gray-400">
              ({skill.steps.filter((s) => s.status === 'completed').length}/
              {skill.steps.length} steps)
            </span>
          </div>
          {stepsOpen ? (
            <ChevronDown size={14} className="text-gray-400" />
          ) : (
            <ChevronRight size={14} className="text-gray-400" />
          )}
        </button>

        <AnimatePresence>
          {stepsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul className="space-y-0.5 px-4 pb-3">
                {skill.steps.map((s) => (
                  <StepRow key={s.id} step={s} />
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary (always visible) */}
      <div className="border-b border-gray-50 bg-gray-50/40 px-4 py-2.5">
        <p className="text-[12px] leading-[1.6] text-gray-600">{skill.summary}</p>
      </div>

      {/* Narrative — month-end / cash-shortfall skills */}
      {skill.narrative && (
        <div className="border-b border-gray-50 px-4 py-3">
          <div className="prose prose-sm max-w-none text-[13px] leading-[1.65] text-gray-700">
            <ReactMarkdown>{skill.narrative}</ReactMarkdown>
          </div>
        </div>
      )}
      {skill.recommendation && !skill.narrative && (
        <div className="border-b border-gray-50 px-4 py-3">
          <div className="prose prose-sm max-w-none text-[13px] leading-[1.65] text-gray-700">
            <ReactMarkdown>{skill.recommendation}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Drafts (collections sweep) */}
      {hasDrafts && (
        <div className="px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-gray-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Drafts ({approvedCount}/{drafts.length} selected)
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {drafts.map((d) => (
              <DraftRow
                key={d.id}
                draft={d}
                approved={approved.has(d.id)}
                onToggle={() => toggleDraft(d.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approval bar */}
      {requiresApproval && phase === 'review' && (
        <div className="flex items-center gap-2 border-t border-amber-100 bg-amber-50/60 px-4 py-3">
          <AlertTriangle size={12} className="shrink-0 text-amber-500" />
          <span className="flex-1 text-[11px] font-medium text-amber-700">
            Nothing sends until you approve. Side-effects are gated.
          </span>
          <button
            type="button"
            onClick={handleReject}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-gray-500 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95"
          >
            Reject all
          </button>
          <button
            type="button"
            onClick={handleApproveAll}
            disabled={approvedCount === 0}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-40"
          >
            <Send size={12} />
            Send {approvedCount}
          </button>
        </div>
      )}

      {phase === 'sending' && (
        <div className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50/60 py-3">
          <Loader2 size={13} className="animate-spin text-gray-400" />
          <span className="text-[12px] text-gray-500">Queuing reminders…</span>
        </div>
      )}
      {phase === 'done' && (
        <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50/60 px-4 py-2.5">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span className="text-[12px] font-semibold text-emerald-700">
            {approvedCount} reminder{approvedCount === 1 ? '' : 's'} queued.
          </span>
        </div>
      )}
      {phase === 'rejected' && (
        <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-2.5">
          <XCircle size={13} className="text-gray-400" />
          <span className="text-[12px] text-gray-500">
            Drafts discarded. Nothing was sent.
          </span>
        </div>
      )}
    </motion.div>
  );
}
