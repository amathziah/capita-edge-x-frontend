import { motion } from 'framer-motion';
import { FileText, CreditCard, Receipt, ShieldCheck, Users, LayoutDashboard, ArrowRight } from 'lucide-react';
import { AI_THEME } from './workspaces/workspaceShared';

const DOMAIN_ICON: Record<string, any> = {
  invoices: FileText,
  payments: CreditCard,
  expenses: Receipt,
  compliance: ShieldCheck,
  customers: Users,
};

export function AIDomainChoiceCard({
  data,
  disabled,
  onSelect,
  onAction,
}: {
  data: any;
  disabled?: boolean;
  onSelect: (choice: any) => void;
  onAction?: (action: any) => void;
}) {
  const choices = Array.isArray(data?.choices) ? data.choices : [];
  const promptSteps = Array.isArray(data?.promptSteps) ? data.promptSteps : [];

  if (choices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2"
    >
      {data?.promptDescription && (
        <p className="mb-2 px-1 text-[13px] leading-relaxed" style={{ color: AI_THEME.textMuted }}>
          {data.promptDescription}
        </p>
      )}

      {promptSteps.length > 0 && (
        <ol className="mb-3 space-y-1.5 list-none">
          {promptSteps.map((step: string, index: number) => (
            <li
              key={`${step}_${index}`}
              className="flex items-start gap-2.5 text-[13px] leading-relaxed"
              style={{ color: AI_THEME.textBody }}
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold mt-px"
                style={{ background: AI_THEME.accentSoft, color: AI_THEME.accent }}
              >
                {index + 1}
              </span>
              <span className="flex-1" style={{ color: AI_THEME.textBody }}>{step}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="space-y-1.5">
        {choices.map((choice: any) => {
          const Icon = DOMAIN_ICON[choice.domain] || LayoutDashboard;
          return (
            <div
              key={choice.id || choice.domain}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              onClick={() => {
                if (!disabled) onSelect(choice);
              }}
              onKeyDown={(event) => {
                if (disabled) return;
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(choice);
                }
              }}
              className="group w-full rounded-2xl px-3 py-3 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: AI_THEME.surfaceSoft,
                border: `1px solid ${AI_THEME.border}`,
                boxShadow: AI_THEME.panelShadow,
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.borderColor = AI_THEME.borderStrong;
                  e.currentTarget.style.background = AI_THEME.surfaceRaised;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = AI_THEME.border;
                e.currentTarget.style.background = AI_THEME.surfaceSoft;
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                  style={{ background: AI_THEME.accentSoft, color: AI_THEME.accent }}
                >
                  <Icon size={16} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[14px] font-semibold" style={{ color: AI_THEME.text }}>{choice.label}</span>
                    {choice.recommended && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: AI_THEME.accentSoft, color: AI_THEME.accent }}
                      >
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12px] leading-relaxed" style={{ color: AI_THEME.textMuted }}>
                    {choice.description}
                  </div>
                </div>

                <ArrowRight
                  size={14}
                  className="mt-1 hidden shrink-0 transition-transform group-hover:translate-x-0.5 sm:block"
                  style={{ color: AI_THEME.textFaint }}
                />
              </div>

              {Array.isArray(choice?.actions) && choice.actions.length > 0 && (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {choice.actions.map((action: any) => (
                    <button
                      key={action.id}
                      type="button"
                      disabled={disabled || !onAction}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!disabled && onAction) onAction(action);
                      }}
                      className="rounded-xl px-3 py-2 text-[11px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: AI_THEME.surface,
                        border: `1px solid ${AI_THEME.border}`,
                        color: AI_THEME.textBody,
                      }}
                      onMouseEnter={(e) => {
                        if (!disabled && onAction) {
                          e.currentTarget.style.borderColor = AI_THEME.borderStrong;
                          e.currentTarget.style.color = AI_THEME.text;
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = AI_THEME.border;
                        e.currentTarget.style.color = AI_THEME.textBody;
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
