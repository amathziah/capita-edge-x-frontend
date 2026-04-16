import { motion } from 'framer-motion';
import { FileText, CreditCard, Receipt, ShieldCheck, Users, LayoutDashboard } from 'lucide-react';

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
  const capabilitySummary = Array.isArray(data?.capabilitySummary) ? data.capabilitySummary : [];

  if (choices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4"
    >
      <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">
        {data?.promptTitle || 'Choose A Workspace'}
      </div>
      <div className="mb-4 text-[12px] leading-relaxed text-gray-400">
        {data?.promptDescription || 'Choose one of the supported workspaces.'}
      </div>

      {capabilitySummary.length > 0 && (
        <div className="mb-4 grid gap-2 md:grid-cols-2">
          {capabilitySummary.map((item: any) => {
            const Icon = DOMAIN_ICON[item.domain] || LayoutDashboard;
            return (
              <div
                key={item.id || item.domain}
                className="rounded-xl border border-white/[0.05] bg-black/20 p-3 cursor-pointer hover:border-teal-400/40 hover:bg-teal-500/10 transition-all"
                onClick={() => onSelect?.(item)}
              >
                <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">
                  <Icon size={12} />
                  {item.label}
                </div>
                <div className="text-[11px] leading-relaxed text-gray-400">
                  {item.description}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {promptSteps.length > 0 && (
        <div className="mb-4 grid gap-2 md:grid-cols-3">
          {promptSteps.map((step: string, index: number) => (
            <div
              key={`${step}_${index}`}
              className="rounded-xl border border-white/[0.05] bg-black/20 p-3"
            >
              <div className="mb-1 text-[8px] font-black uppercase tracking-[0.2em] text-gray-500">
                Step {index + 1}
              </div>
              <div className="text-[11px] leading-relaxed text-gray-300">{step}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2">
        {choices.map((choice: any) => {
          const Icon = DOMAIN_ICON[choice.domain] || LayoutDashboard;
          const choiceSteps = Array.isArray(choice?.steps) ? choice.steps : [];
          return (
            <button
              key={choice.id || choice.domain}
              type="button"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(choice);
              }}
              className={`rounded-xl border px-3 py-3 text-left transition-all ${
                disabled
                  ? 'cursor-not-allowed border-white/[0.05] bg-white/[0.02] opacity-50'
                  : 'border-white/[0.08] bg-black/20 hover:border-teal-500/30 hover:bg-teal-500/[0.06]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <div className="mt-0.5 rounded-lg border border-teal-500/15 bg-teal-500/10 p-1.5 text-teal-400">
                    <Icon size={13} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12px] font-bold text-white">{choice.label}</span>
                      {choice.recommended && (
                        <span className="rounded-full border border-teal-500/25 bg-teal-500/10 px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.18em] text-teal-300">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] leading-relaxed text-gray-500">
                      {choice.description}
                    </div>
                    {choiceSteps.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {choiceSteps.map((step: string, index: number) => (
                          <div key={`${choice.domain}_${index}`} className="text-[10px] leading-relaxed text-gray-400">
                            {index + 1}. {step}
                          </div>
                        ))}
                      </div>
                    )}
                    {Array.isArray(choice?.actions) && choice.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {choice.actions.map((action: any) => (
                          <button
                            key={action.id}
                            type="button"
                            disabled={disabled || !onAction}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!disabled && onAction) onAction(action);
                            }}
                            className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] transition-all ${
                              disabled || !onAction
                                ? 'cursor-not-allowed border-white/[0.05] bg-white/[0.02] text-gray-600'
                                : 'border-white/[0.08] bg-white/[0.03] text-gray-300 hover:border-teal-500/30 hover:bg-teal-500/[0.06]'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.2em] text-gray-600">
                  Open
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
