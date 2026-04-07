import { motion } from 'framer-motion';

export const genCardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 20,
      stiffness: 250,
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const genItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
};

export function createMoneyFormatter(currencyCode = 'INR') {
  const currencySymbol = currencyCode === 'USD' ? '$' : '₹';
  return (value: number | undefined | null) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return `${currencySymbol}${Number(value).toLocaleString()}`;
  };
}

export function formatCount(value: number | undefined | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const numeric = Number(value);
  if (numeric === 0) return '—';
  return numeric.toLocaleString();
}

export function formatDate(value?: string | null) {
  if (!value) return 'No date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString();
}

export function WorkspaceViewPills({
  views,
  selectedView,
  onSelectView,
  disabled,
}: {
  views?: Array<{ id: string; label: string }>;
  selectedView?: string | null;
  onSelectView?: (viewId: string) => void;
  disabled?: boolean;
}) {
  if (!views || views.length === 0) return null;

  return (
    <motion.div variants={genItemVariants} className="mb-4 flex flex-wrap gap-2">
      {views.map((view) => {
        const isSelected = selectedView === view.id;
        return (
          <button
            key={view.id}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!disabled && onSelectView && view.id !== selectedView) {
                onSelectView(view.id);
              }
            }}
            disabled={disabled || !onSelectView || isSelected}
            className={`inline-flex items-center rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.18em] ${
              isSelected
                ? 'border-teal-500/30 bg-teal-500/12 text-teal-300'
                : disabled
                  ? 'cursor-not-allowed border-white/[0.08] bg-white/[0.03] text-gray-600'
                  : 'border-white/[0.08] bg-white/[0.03] text-gray-500 hover:border-white/[0.16] hover:text-gray-300'
            }`}
          >
            {view.label}
          </button>
        );
      })}
    </motion.div>
  );
}

export function WorkspaceGuidancePanel({
  guidance,
  onSelectStep,
  disabled,
}: {
  guidance?: {
    title?: string;
    summary?: string;
    steps?: Array<{ id: string; label: string; description?: string; view?: string }>;
  } | null;
  onSelectStep?: (viewId: string) => void;
  disabled?: boolean;
}) {
  if (!guidance) return null;

  return (
    <motion.div
      variants={genItemVariants}
      className="mb-4 rounded-xl border border-white/[0.06] bg-black/20 p-3"
    >
      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">
        {guidance.title || 'How To Analyze'}
      </div>
      {guidance.summary && (
        <div className="mb-3 text-[11px] leading-relaxed text-gray-400">{guidance.summary}</div>
      )}

      {Array.isArray(guidance.steps) && guidance.steps.length > 0 && (
        <div className="grid gap-2 md:grid-cols-3">
          {guidance.steps.map((step, index) => (
            <button
              key={step.id || `${step.view}_${index}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (!disabled && onSelectStep && step.view) {
                  onSelectStep(step.view);
                }
              }}
              disabled={disabled || !onSelectStep || !step.view}
              className={`rounded-xl border p-3 text-left transition-all ${
                disabled || !onSelectStep || !step.view
                  ? 'cursor-default border-white/[0.05] bg-white/[0.02]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-teal-500/30 hover:bg-teal-500/[0.05]'
              }`}
            >
              <div className="mb-1 text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
                Step {index + 1}
              </div>
              <div className="text-[11px] font-semibold text-white">{step.label}</div>
              {step.description && (
                <div className="mt-1 text-[10px] leading-relaxed text-gray-500">
                  {step.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function WorkspaceActionBar({
  actions,
  onAction,
  disabled,
}: {
  actions?: Array<{ id: string; label: string; description?: string }>;
  onAction?: (action: any) => void;
  disabled?: boolean;
}) {
  if (!Array.isArray(actions) || actions.length === 0) return null;

  return (
    <motion.div variants={genItemVariants} className="mb-4 flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!disabled && onAction) onAction(action);
          }}
          disabled={disabled || !onAction}
          className={`rounded-xl border px-3 py-2 text-left transition-all ${
            disabled || !onAction
              ? 'cursor-not-allowed border-white/[0.05] bg-white/[0.02] text-gray-600'
              : 'border-white/[0.08] bg-white/[0.03] text-gray-200 hover:border-teal-500/30 hover:bg-teal-500/[0.06]'
          }`}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.18em]">{action.label}</div>
          {action.description && (
            <div className="mt-1 text-[10px] leading-relaxed text-gray-500">{action.description}</div>
          )}
        </button>
      ))}
    </motion.div>
  );
}
