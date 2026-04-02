import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Zap, ArrowRight, Sparkles, Crown, X
} from 'lucide-react';

// ─── Plan Data ────────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Free',
    tagline: 'Get started, no card needed',
    badge: null,
    monthlyPrice: 0,
    annualPrice: 0,
    annualSavings: 0,
    trialNote: '14-day Solo trial included',
    aiQueries: 25,
    color: 'gray',
    icon: Zap,
    gradient: 'from-gray-400/10 to-gray-500/5',
    borderActive: 'border-gray-200',
    features: [
      { label: '5 invoices / month', included: true },
      { label: '15 clients', included: true },
      { label: 'PDF invoice download', included: true },
      { label: '25 AI queries / month', included: true },
      { label: 'Basic cash & revenue Q&A', included: true },
      { label: 'Email invoices to clients', included: false },
      { label: 'Auto follow-up emails', included: false },
      { label: 'GST-compliant reports', included: false },
      { label: 'Strategic CFO briefings', included: false },
      { label: 'Cash runway analysis', included: false },
      { label: 'Weekly cash summary', included: false },
    ],
  },
  {
    id: 'solo',
    name: 'Solo',
    tagline: 'For freelancers who mean business',
    badge: 'Most Popular',
    monthlyPrice: 299,
    annualPrice: 249,          // 2990/12 ≈ ₹249/mo
    annualSavings: 598,
    trialNote: null,
    aiQueries: 150,
    color: 'teal',
    icon: Sparkles,
    gradient: 'from-teal-500/15 to-cyan-500/8',
    borderActive: 'border-teal-400/40',
    features: [
      { label: 'Unlimited invoices', included: true },
      { label: 'Unlimited clients', included: true },
      { label: 'PDF invoice download', included: true },
      { label: '150 AI queries / month', included: true },
      { label: 'Strategic CFO advice', included: true },
      { label: 'Email invoices to clients', included: true },
      { label: 'Auto follow-up emails', included: true },
      { label: 'GST-compliant reports', included: true },
      { label: 'Cash runway analysis', included: true },
      { label: 'Revenue concentration risk', included: true },
      { label: 'Weekly cash summary email', included: true },
    ],
  },
  {
    id: 'solo_pro',
    name: 'Solo Pro',
    tagline: 'Deep intelligence for power users',
    badge: 'Best Value',
    monthlyPrice: 699,
    annualPrice: 582,          // 6990/12 ≈ ₹582/mo
    annualSavings: 1398,
    trialNote: null,
    aiQueries: 500,
    color: 'violet',
    icon: Crown,
    gradient: 'from-violet-500/15 to-purple-500/8',
    borderActive: 'border-violet-400/40',
    features: [
      { label: 'Everything in Solo', included: true },
      { label: '500 AI queries / month', included: true },
      { label: 'Cash flow forecasting', included: true },
      { label: 'Client churn prediction', included: true },
      { label: 'Proactive risk alerts', included: true },
      { label: 'AI collection letter drafts', included: true },
      { label: 'Settlement negotiation AI', included: true },
      { label: 'Priority AI response queue', included: true },
      { label: 'Priority support', included: true },
      { label: 'Early access to new features', included: true },
      { label: 'White-label invoices', included: false },
    ],
  },
];


// ─── Color helpers ────────────────────────────────────────────────────────────
const COLOR = {
  gray:   { badge: 'bg-gray-100 text-gray-600',   btn: 'bg-gray-900 hover:bg-gray-700 text-white',     ring: 'ring-gray-200',   check: 'text-gray-400',   glow: '' },
  teal:   { badge: 'bg-teal-50 text-teal-700',    btn: 'bg-teal-500 hover:bg-teal-400 text-[#0c0f1a]', ring: 'ring-teal-400/30', check: 'text-teal-500',  glow: '0 0 40px rgba(45,212,191,0.15)' },
  violet: { badge: 'bg-violet-50 text-violet-700',btn: 'bg-violet-600 hover:bg-violet-500 text-white', ring: 'ring-violet-400/30',check: 'text-violet-500',glow: '0 0 40px rgba(139,92,246,0.15)' },
};

// ─── PlanCard ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, annual, currentPlan, onUpgrade }: {
  plan: typeof PLANS[0];
  annual: boolean;
  currentPlan?: string | null;
  onUpgrade: (id: string) => void;
}) {
  const c = COLOR[plan.color as keyof typeof COLOR];
  const price = annual ? plan.annualPrice : plan.monthlyPrice;
  const isCurrent = plan.id === currentPlan;
  const isHigher = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === currentPlan);
  const Icon = plan.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col rounded-2xl border bg-white overflow-hidden ${plan.badge ? 'shadow-xl ring-2 ' + c.ring : 'shadow-sm border-gray-100'}`}
      style={plan.badge ? { boxShadow: c.glow } : {}}
    >
      {/* Popular badge */}
      {plan.badge && (
        <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${c.badge}`}>
          {plan.badge}
        </div>
      )}

      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${plan.gradient} px-6 pt-6 pb-5 border-b border-gray-50`}>
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`p-1.5 rounded-lg ${plan.color === 'teal' ? 'bg-teal-500/15' : plan.color === 'violet' ? 'bg-violet-500/15' : 'bg-gray-100'}`}>
            <Icon className={`w-4 h-4 ${plan.color === 'teal' ? 'text-teal-600' : plan.color === 'violet' ? 'text-violet-600' : 'text-gray-500'}`} />
          </div>
          <span className="text-sm font-black text-gray-900">{plan.name}</span>
        </div>
        <p className="text-[12px] text-gray-500 mb-4 leading-snug">{plan.tagline}</p>

        {/* Price */}
        <div className="flex items-end gap-1 mb-1">
          {price === 0 ? (
            <span className="text-3xl font-black text-gray-900">Free</span>
          ) : (
            <>
              <span className="text-xs text-gray-400 mb-1.5">₹</span>
              <span className="text-3xl font-black text-gray-900">{price.toLocaleString('en-IN')}</span>
              <span className="text-xs text-gray-400 mb-1.5">/mo</span>
            </>
          )}
        </div>

        {annual && plan.annualSavings > 0 && (
          <p className="text-[11px] text-emerald-600 font-semibold">Save ₹{plan.annualSavings.toLocaleString('en-IN')}/yr with annual</p>
        )}
        {plan.trialNote && (
          <p className="text-[11px] text-blue-600 font-semibold mt-0.5">{plan.trialNote}</p>
        )}

        {/* AI query chip */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-gray-100 text-[11px] font-semibold text-gray-600">
          <Sparkles className={`w-3 h-3 ${plan.color === 'teal' ? 'text-teal-500' : plan.color === 'violet' ? 'text-violet-500' : 'text-gray-400'}`} />
          {plan.aiQueries === Infinity ? 'Unlimited' : plan.aiQueries} AI queries / month
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-5 flex-1">
        <ul className="space-y-2.5">
          {plan.features.map((f, i) => (
            <li key={i} className={`flex items-start gap-2.5 text-[12.5px] ${f.included ? 'text-gray-700' : 'text-gray-300'}`}>
              {f.included
                ? <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${c.check}`} />
                : <X className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-200" />
              }
              {f.label}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="px-6 pb-6 pt-2">
        {isCurrent ? (
          <div className="w-full py-2 rounded-xl border border-gray-200 text-center text-[12px] font-semibold text-gray-400">
            Your current plan
          </div>
        ) : isHigher ? (
          <button
            onClick={() => onUpgrade(plan.id)}
            className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1.5 ${c.btn}`}
          >
            Upgrade to {plan.name}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button className="w-full py-2 rounded-xl border border-gray-200 text-center text-[12px] font-semibold text-gray-400 cursor-not-allowed">
            Downgrade
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function Pricing({ currentPlan, isEmbedded = false }: { currentPlan?: string | null, isEmbedded?: boolean }) {
  const [annual, setAnnual] = useState(false);
  const [upgradeTarget, setUpgradeTarget] = useState<string | null>(null);

  const handleUpgrade = (planId: string) => {
    setUpgradeTarget(planId);
  };

  return (
    <div className={isEmbedded ? "w-full py-10 md:py-20 bg-white shadow-xl md:shadow-2xl rounded-2xl md:rounded-3xl" : "min-h-screen bg-gray-50/50"}>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 md:px-8 ${isEmbedded ? '' : 'py-10 md:py-16'} space-y-8 md:space-y-12`}>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-[11px] font-bold text-teal-700 uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            Capita AI Plans
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
            Your AI-powered CFO,<br />
            <span className="text-teal-500">priced for freelancers</span>
          </h1>
          <p className="text-[14px] text-gray-500 max-w-md mx-auto">
            All plans include a 14-day full-feature trial. No credit card required to start.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-4 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${!annual ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all flex items-center gap-1.5 ${annual ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Annual
              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">SAVE 17%</span>
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              currentPlan={currentPlan}
              onUpgrade={handleUpgrade}
            />
          ))}
        </div>


        {/* Upgrade confirmation modal */}
        <AnimatePresence>
          {upgradeTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setUpgradeTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                {(() => {
                  const plan = PLANS.find(p => p.id === upgradeTarget)!;
                  const price = annual ? plan.annualPrice : plan.monthlyPrice;
                  const c = COLOR[plan.color as keyof typeof COLOR];
                  const Icon = plan.icon;
                  return (
                    <>
                      <div className={`p-2.5 rounded-xl w-fit mb-4 ${plan.color === 'teal' ? 'bg-teal-50' : 'bg-violet-50'}`}>
                        <Icon className={`w-5 h-5 ${plan.color === 'teal' ? 'text-teal-600' : 'text-violet-600'}`} />
                      </div>
                      <h3 className="text-base font-black text-gray-900 mb-1">Upgrade to {plan.name}</h3>
                      <p className="text-[13px] text-gray-500 mb-5">
                        ₹{price.toLocaleString('en-IN')}/mo · billed {annual ? 'annually' : 'monthly'}
                        {annual && plan.annualSavings > 0 && <span className="text-emerald-600 font-semibold"> · Save ₹{plan.annualSavings.toLocaleString('en-IN')}</span>}
                      </p>
                      <button
                        className={`w-full py-2.5 rounded-xl text-[13px] font-bold transition-all active:scale-95 mb-2 ${c.btn}`}
                      >
                        Proceed to payment
                      </button>
                      <button
                        onClick={() => setUpgradeTarget(null)}
                        className="w-full py-2 rounded-xl text-[12px] font-semibold text-gray-400 hover:text-gray-600 transition"
                      >
                        Cancel
                      </button>
                    </>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
