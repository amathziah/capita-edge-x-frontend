import { motion } from 'framer-motion';

export const AI_THEME = {
  bg: '#f9fafb',
  bgSecondary: '#f3f4f6',
  sidebar: '#ffffff',
  surface: '#ffffff',
  surfaceRaised: '#f9fafb',
  surfaceSoft: '#f3f4f6',
  border: '#e5e7eb',
  borderStrong: '#d1d5db',
  text: '#111827',
  textBody: '#374151',
  textMuted: '#6b7280',
  textFaint: '#9ca3af',
  accent: '#111827',
  accentHover: '#374151',
  accentSoft: 'rgba(17, 24, 39, 0.06)',
  accentSoftStrong: 'rgba(17, 24, 39, 0.10)',
  accentGlow: 'rgba(17, 24, 39, 0.15)',
  danger: '#dc2626',
  dangerSoft: '#fef2f2',
  warning: '#d97706',
  warningSoft: '#fffbeb',
  shadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  panelShadow: '0 1px 2px rgba(0, 0, 0, 0.06)',
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

// Fluid, truncating value used inside stat tiles. Shrinks on narrow widths
// so long currency strings (e.g. ₹1,23,45,678) never overflow the tile.
export function StatValue({ children, color }: { children: any; color?: string }) {
  return (
    <div
      className="font-black tabular-nums leading-tight tracking-tight truncate"
      style={{
        color: color ?? AI_THEME.text,
        fontSize: 'clamp(13px, 3.6cqi, 17px)',
      }}
      title={typeof children === 'string' || typeof children === 'number' ? String(children) : undefined}
    >
      {children}
    </div>
  );
}

// Wraps a stat tile so child fonts can scale with container width.
export function StatTile({
  label,
  children,
  style,
  labelColor,
}: {
  label: string;
  children: any;
  style?: any;
  labelColor?: string;
}) {
  return (
    <div className="rounded-2xl p-3 min-w-0 overflow-hidden" style={{ ...style, containerType: 'inline-size' } as any}>
      <div
        className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] truncate"
        style={{ color: labelColor ?? AI_THEME.textFaint }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

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
            className="rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors disabled:cursor-not-allowed"
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
    <motion.div variants={genItemVariants} className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (!disabled && onAction) onAction(action);
          }}
          disabled={disabled || !onAction}
          className="w-full rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed sm:w-auto"
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
