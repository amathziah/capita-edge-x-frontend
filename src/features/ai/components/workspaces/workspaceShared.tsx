import { motion } from 'framer-motion';

export const AI_THEME = {
  bg: '#060b10',
  bgSecondary: '#09121a',
  sidebar: '#0b1218',
  surface: 'rgba(12, 20, 28, 0.88)',
  surfaceRaised: 'rgba(16, 27, 37, 0.96)',
  surfaceSoft: 'rgba(20, 32, 43, 0.72)',
  border: 'rgba(154, 179, 198, 0.14)',
  borderStrong: 'rgba(39, 199, 166, 0.34)',
  text: '#f5f9fc',
  textBody: '#d7e2eb',
  textMuted: '#9db0c1',
  textFaint: '#6a7b8d',
  accent: '#27c7a6',
  accentHover: '#3ad7b5',
  accentSoft: 'rgba(39, 199, 166, 0.14)',
  accentSoftStrong: 'rgba(39, 199, 166, 0.22)',
  accentGlow: 'rgba(39, 199, 166, 0.34)',
  danger: '#ff8a80',
  dangerSoft: 'rgba(255, 138, 128, 0.14)',
  warning: '#f7c26d',
  warningSoft: 'rgba(247, 194, 109, 0.12)',
  shadow: '0 18px 50px rgba(0, 0, 0, 0.32)',
  panelShadow: '0 10px 30px rgba(0, 0, 0, 0.22)',
  headingFont: "'Sora', ui-sans-serif, system-ui, sans-serif",
  bodyFont: "'Manrope', ui-sans-serif, system-ui, sans-serif",
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
                ? {
                    background: AI_THEME.accentSoftStrong,
                    color: AI_THEME.text,
                    border: `1px solid ${AI_THEME.borderStrong}`,
                  }
                : disabled
                ? {
                    background: 'transparent',
                    color: AI_THEME.textFaint,
                    border: `1px solid ${AI_THEME.border}`,
                    opacity: 0.6,
                  }
                : {
                    background: AI_THEME.surfaceSoft,
                    color: AI_THEME.textMuted,
                    border: `1px solid ${AI_THEME.border}`,
                  }
            }
            onMouseEnter={(e) => {
              if (!isSelected && !disabled && onSelectView) {
                e.currentTarget.style.borderColor = AI_THEME.borderStrong;
                e.currentTarget.style.color = AI_THEME.text;
                e.currentTarget.style.background = AI_THEME.surfaceRaised;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected && !disabled && onSelectView) {
                e.currentTarget.style.borderColor = AI_THEME.border;
                e.currentTarget.style.color = AI_THEME.textMuted;
                e.currentTarget.style.background = AI_THEME.surfaceSoft;
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
            background: AI_THEME.surfaceSoft,
            border: `1px solid ${AI_THEME.border}`,
            color: AI_THEME.text,
            opacity: disabled || !onAction ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled && onAction) {
              e.currentTarget.style.borderColor = AI_THEME.borderStrong;
              e.currentTarget.style.background = AI_THEME.accentSoft;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = AI_THEME.border;
            e.currentTarget.style.background = AI_THEME.surfaceSoft;
          }}
        >
          <div className="text-[13px] font-semibold">{action.label}</div>
          {action.description && (
            <div className="mt-0.5 text-[11px]" style={{ color: AI_THEME.textMuted }}>{action.description}</div>
          )}
        </button>
      ))}
    </motion.div>
  );
}
