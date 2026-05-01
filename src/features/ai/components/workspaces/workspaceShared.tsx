import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── App-aligned theme ────────────────────────────────────────────────────────
// Matches tailwind.config: primary #14B8B8, background #F7FBFD, text #0F172A

export const T = {
  primary:    '#14B8B8',
  primaryBg:  '#ECF6F8',
  bg:         '#F7FBFD',
  card:       '#FFFFFF',
  border:     '#E2E8F0',
  borderSoft: '#F1F5F9',
  text:       '#0F172A',
  muted:      '#475569',
  light:      '#94A3B8',
  danger:     '#EF4444',
  dangerBg:   '#FEF2F2',
  dangerBorder:'#FECACA',
  warning:    '#F59E0B',
  warningBg:  '#FFFBEB',
  warningBorder:'#FDE68A',
  success:    '#22C55E',
  successBg:  '#ECFDF5',
  successBorder:'#BBF7D0',
  info:       '#3B82F6',
  infoBg:     '#EFF6FF',
};

// ─── Animations ───────────────────────────────────────────────────────────────

export const cardVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, staggerChildren: 0.05 } },
};

export const itemVariants = {
  hidden:  { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18 } },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export function fmt(value: number | null | undefined, currency = 'USD') {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(Number(value));
}

export function fmtCount(value: number | null | undefined) {
  if (value == null || Number(value) === 0) return '—';
  return Number(value).toLocaleString();
}

export function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function fmtDays(value?: number | null) {
  if (value == null || value === 0) return null;
  return value === 1 ? '1 day' : `${value}d`;
}

// ─── AgentCard — the workspace shell ─────────────────────────────────────────

interface AgentCardProps {
  icon: LucideIcon;
  label: string;
  accent: string;
  accentBg: string;
  views?: { id: string; label: string }[];
  selectedView?: string;
  onSelectView?: (id: string) => void;
  actions?: { id: string; label: string; description?: string; to?: string }[];
  onAction?: (action: any) => void;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function AgentCard({
  icon: Icon, label, accent, accentBg,
  views, selectedView, onSelectView,
  actions, onAction, isLoading, children,
}: AgentCardProps) {
  return (
    <motion.div
      variants={cardVariants} initial="hidden" animate="visible"
      className="mt-3 mb-2 overflow-hidden rounded-2xl border bg-white shadow-card"
      style={{ borderColor: T.border }}
    >
      {/* Domain header strip */}
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3"
        style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
            style={{ background: accentBg, color: accent }}>
            <Icon size={13} />
          </span>
          <span className="font-display text-[11px] font-bold uppercase tracking-widest truncate"
            style={{ color: accent }}>
            {label}
          </span>
        </div>

        {/* View pills */}
        {views && views.length > 1 && (
          <div className="flex shrink-0 gap-1">
            {views.map(v => (
              <button
                key={v.id}
                onClick={() => !isLoading && onSelectView?.(v.id)}
                disabled={isLoading || v.id === selectedView}
                className="rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-wide transition-all disabled:cursor-default"
                style={v.id === selectedView
                  ? { background: accentBg, color: accent, border: `1px solid ${accent}40` }
                  : { background: 'transparent', color: T.light, border: `1px solid ${T.border}` }
                }
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {children}

        {/* Quick actions */}
        {actions && actions.length > 0 && (
          <motion.div variants={itemVariants} className="flex flex-wrap gap-2 pt-1">
            {actions.map(a => (
              <button
                key={a.id}
                onClick={() => onAction?.(a)}
                disabled={isLoading}
                className="group flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition-all hover:shadow-sm disabled:opacity-50"
                style={{ borderColor: T.border, color: T.muted, background: T.bg }}
              >
                {a.label}
                <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ─── AgentInsight — synthesized agent recommendation ──────────────────────────

export function AgentInsight({
  summary, level = 'info', action, onAction,
}: {
  summary: string;
  level?: 'ok' | 'warn' | 'critical' | 'info';
  action?: { id: string; label: string };
  onAction?: (a: any) => void;
}) {
  const config = {
    ok:       { bg: T.successBg, border: T.successBorder, icon: CheckCircle, color: T.success, label: 'All Good' },
    warn:     { bg: T.warningBg, border: T.warningBorder, icon: AlertTriangle, color: T.warning, label: 'Heads Up' },
    critical: { bg: T.dangerBg,  border: T.dangerBorder,  icon: Zap,          color: T.danger,  label: 'Act Now'  },
    info:     { bg: T.infoBg,    border: '#BFDBFE',        icon: Zap,          color: T.info,    label: 'Insight'  },
  }[level];

  const IconComp = config.icon;

  return (
    <motion.div variants={itemVariants}
      className="flex items-start gap-3 rounded-xl p-3"
      style={{ background: config.bg, border: `1px solid ${config.border}` }}
    >
      <IconComp size={14} className="shrink-0 mt-0.5" style={{ color: config.color }} />
      <div className="flex-1 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: config.color }}>
          {config.label}
        </span>
        <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: T.text }}>{summary}</p>
      </div>
      {action && onAction && (
        <button
          onClick={() => onAction(action)}
          className="shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80"
          style={{ background: config.color, color: '#fff' }}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}

// ─── StatGrid ─────────────────────────────────────────────────────────────────

interface Stat {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  accent?: string;
}

export function StatGrid({ stats }: { stats: Stat[] }) {
  return (
    <motion.div variants={itemVariants}
      className={`grid gap-2 ${stats.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {stats.map(({ label, value, trend, trendLabel, accent }) => (
        <div key={label} className="rounded-xl p-3"
          style={{ background: T.bg, border: `1px solid ${T.border}` }}>
          <div className="mb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: T.light }}>{label}</div>
          <div className="text-[14px] font-black tabular-nums truncate"
            style={{ color: accent ?? T.text, fontFamily: 'Sora, sans-serif' }}>
            {value || '—'}
          </div>
          {trend && (
            <div className="mt-1 flex items-center gap-1">
              {trend === 'up'   && <TrendingUp   size={9} style={{ color: T.success }} />}
              {trend === 'down' && <TrendingDown  size={9} style={{ color: T.danger  }} />}
              {trend === 'flat' && <Minus         size={9} style={{ color: T.light   }} />}
              {trendLabel && <span className="text-[9px]" style={{ color: T.light }}>{trendLabel}</span>}
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export function Section({
  label, accent = T.muted, bg = T.bg, borderColor = T.border, children,
}: {
  label: string; accent?: string; bg?: string; borderColor?: string; children: React.ReactNode;
}) {
  return (
    <motion.div variants={itemVariants} className="rounded-xl overflow-hidden"
      style={{ background: bg, border: `1px solid ${borderColor}` }}>
      <div className="px-3 pt-2.5 pb-1 text-[9px] font-bold uppercase tracking-widest"
        style={{ color: accent }}>{label}</div>
      <div className="px-3 pb-2.5 space-y-2">{children}</div>
    </motion.div>
  );
}

// ─── PriorityRow — agentic item row with optional action ──────────────────────

export function PriorityRow({
  primary, secondary, meta, amount, amountColor, badge, badgeBg, action, onAction,
}: {
  primary: string;
  secondary?: string;
  meta?: string;
  amount?: string;
  amountColor?: string;
  badge?: string;
  badgeBg?: string;
  action?: { id: string; label: string };
  onAction?: (a: any) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="truncate text-[12px] font-semibold" style={{ color: T.text }}>{primary}</span>
          {badge && (
            <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{ background: badgeBg ?? T.primaryBg, color: T.primary }}>
              {badge}
            </span>
          )}
        </div>
        {(secondary || meta) && (
          <div className="flex items-center gap-1.5 mt-0.5">
            {secondary && <span className="text-[10px] uppercase tracking-wide" style={{ color: T.light }}>{secondary}</span>}
            {secondary && meta && <span style={{ color: T.border }}>·</span>}
            {meta && <span className="text-[10px]" style={{ color: T.light }}>{meta}</span>}
          </div>
        )}
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {amount && (
          <span className="text-[12px] font-bold tabular-nums"
            style={{ color: amountColor ?? T.text }}>{amount}</span>
        )}
        {action && onAction && (
          <button
            onClick={() => onAction(action)}
            className="rounded-lg px-2 py-1 text-[10px] font-semibold transition-all hover:opacity-80"
            style={{ background: T.primaryBg, color: T.primary, border: `1px solid #b2e4e4` }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── SimpleRow — lightweight row without action ───────────────────────────────

export function Row({
  primary, secondary, amount, sub, amountColor,
}: {
  primary: string; secondary?: string; amount?: string; sub?: string; amountColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-semibold" style={{ color: T.text }}>{primary}</div>
        {secondary && <div className="text-[10px] uppercase tracking-wide" style={{ color: T.light }}>{secondary}</div>}
      </div>
      {(amount || sub) && (
        <div className="shrink-0 text-right">
          {amount && <div className="text-[12px] font-bold tabular-nums" style={{ color: amountColor ?? T.text }}>{amount}</div>}
          {sub && <div className="text-[10px]" style={{ color: T.light }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────────────────────────────

export function Empty({ text }: { text: string }) {
  return (
    <div className="py-2 text-center text-[11px]" style={{ color: T.light }}>{text}</div>
  );
}

// ─── RiskBadge ────────────────────────────────────────────────────────────────

export function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' | 'ok' }) {
  const map = {
    high:   { label: 'High Risk',  bg: T.dangerBg,  color: T.danger  },
    medium: { label: 'Medium',     bg: T.warningBg, color: T.warning },
    low:    { label: 'Low',        bg: T.successBg, color: T.success },
    ok:     { label: 'On Track',   bg: T.successBg, color: T.success },
  }[level];
  return (
    <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
      style={{ background: map.bg, color: map.color }}>
      {map.label}
    </span>
  );
}
