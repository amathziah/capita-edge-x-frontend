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
      className="mt-3 space-y-1.5"
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
              style={{ color: C.textBody }}
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
            <button
              key={choice.id || choice.domain}
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(choice);
              }}
              className="group w-full rounded-xl px-3 py-3 text-left transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: AI_THEME.surfaceSoft,
                border: `1px solid ${AI_THEME.border}`,
                boxShadow: AI_THEME.panelShadow,
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
              <div
                className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: AI_THEME.accentSoft, color: AI_THEME.accent }}
              >
                <Icon size={16} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold" style={{ color: AI_THEME.text }}>{choice.label}</span>
                  {choice.recommended && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-px rounded"
                      style={{ background: AI_THEME.accentSoft, color: AI_THEME.accent }}
                    >
                      Recommended
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] leading-relaxed" style={{ color: AI_THEME.textMuted }}>
                  {choice.description}
                </div>

                {Array.isArray(choice?.actions) && choice.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {choice.actions.map((action: any) => (
                      <button
                        key={action.id}
                        type="button"
                        disabled={disabled || !onAction}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!disabled && onAction) onAction(action);
                        }}
                        className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              <ArrowRight
                size={14}
                className="shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: AI_THEME.textFaint }}
              />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
