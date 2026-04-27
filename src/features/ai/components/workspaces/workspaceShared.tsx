import { motion } from 'framer-motion';

const C = {
  surface: '#ffffff',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  text: '#1a1f36',
  textBody: '#4f566b',
  textMuted: '#697386',
  textFaint: '#a3acb9',
  accent: '#635bff',
  accentSoft: '#f0eeff',
};

export const genCardVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      damping: 22,
      stiffness: 260,
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const genItemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: 'easeOut' as const },
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
    <motion.div variants={genItemVariants} className="mb-4 flex flex-wrap gap-1.5">
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
            className="rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors disabled:cursor-not-allowed"
            style={
              isSelected
                ? { background: C.accentSoft, color: C.accent, border: `1px solid ${C.accentSoft}` }
                : disabled
                ? { background: 'transparent', color: C.textFaint, border: `1px solid ${C.border}`, opacity: 0.6 }
                : { background: C.surface, color: C.textBody, border: `1px solid ${C.border}` }
            }
            onMouseEnter={(e) => {
              if (!isSelected && !disabled && onSelectView) {
                e.currentTarget.style.borderColor = C.borderStrong;
                e.currentTarget.style.color = C.text;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !disabled && onSelectView) {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.color = C.textBody;
              }
            }}
          >
            {view.label}
          </button>
        );
      })}
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
          className="rounded-lg px-3 py-2 text-left transition-colors disabled:cursor-not-allowed"
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            color: C.text,
            opacity: disabled || !onAction ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled && onAction) {
              e.currentTarget.style.borderColor = C.accent;
              e.currentTarget.style.background = C.accentSoft;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.background = C.surface;
          }}
        >
          <div className="text-[13px] font-semibold">{action.label}</div>
          {action.description && (
            <div className="mt-0.5 text-[11px]" style={{ color: C.textMuted }}>{action.description}</div>
          )}
        </button>
      ))}
    </motion.div>
  );
}
