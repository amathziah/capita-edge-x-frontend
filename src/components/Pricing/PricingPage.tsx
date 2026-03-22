import { useState } from 'react';
import {
    Check, X, Zap, Shield, Crown, Building2, Briefcase, Star, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription, PlanTier } from '../../contexts/SubscriptionContext';
import { usePersona } from '../../contexts/PersonaContext';

// ═══════════════════════════════════════════════════════════════════════
//  Tier config for the pricing page (client-side display only)
// ═══════════════════════════════════════════════════════════════════════

interface TierCard {
    slug: PlanTier;
    name: string;
    tagline: string;
    price: number | null;
    priceAnnual: number | null;
    priceLabel?: string;
    icon: typeof Zap;
    gradient: string;
    borderColor: string;
    bgTint: string;
    popular?: boolean;
    features: string[];
    notIncluded?: string[];
    cta: string;
    variantEnvKey?: string;
}

const TIERS: TierCard[] = [
    {
        slug: 'starter',
        name: 'Starter',
        tagline: 'Get started for free',
        price: 0,
        priceAnnual: 0,
        icon: Star,
        gradient: 'from-gray-400 to-gray-600',
        borderColor: 'border-gray-200',
        bgTint: 'bg-gray-50/30',
        features: [
            '5 Invoices',
            '10 AI Requests/day',
            'PDF Download',
            '20 Products & Customers',
            'Basic Reports',
        ],
        notIncluded: ['Email Invoices', 'Bulk Email', 'Priority Support'],
        cta: 'Current Plan',
    },
    {
        slug: 'freelancer',
        name: 'Freelancer',
        tagline: 'For solo hustlers scaling up',
        price: 499,
        priceAnnual: 4990,
        icon: Zap,
        gradient: 'from-blue-500 to-indigo-600',
        borderColor: 'border-blue-200',
        bgTint: 'bg-blue-50/20',
        popular: true,
        features: [
            'Unlimited Invoices',
            '100 AI Requests/day',
            'Email Invoices',
            'PDF Download',
            'Full Reports & Analytics',
            'Unlimited Products & Customers',
            'Basic Inventory',
        ],
        cta: 'Start Freelancer',
        variantEnvKey: 'VITE_LS_VARIANT_FREELANCER',
    },
    {
        slug: 'smb',
        name: 'SMB',
        tagline: 'For growing teams & agencies',
        price: 1499,
        priceAnnual: 14990,
        icon: Briefcase,
        gradient: 'from-violet-500 to-purple-700',
        borderColor: 'border-violet-200',
        bgTint: 'bg-violet-50/20',
        features: [
            'Unlimited Everything',
            '500 AI Requests/day',
            'Email + Bulk Email',
            'Priority Support',
            'Full Inventory Management',
            'Advanced Reports',
        ],
        cta: 'Go SMB',
        variantEnvKey: 'VITE_LS_VARIANT_SMB',
    },
    {
        slug: 'ca_pro',
        name: 'CA Pro',
        tagline: 'White-label for CAs',
        price: 10000,
        priceAnnual: null,
        priceLabel: '₹10K setup + ₹500/client/mo',
        icon: Crown,
        gradient: 'from-amber-500 to-orange-600',
        borderColor: 'border-amber-200',
        bgTint: 'bg-amber-50/20',
        features: [
            'White-label Branding',
            'Multi-client Management',
            '200 AI Requests/day',
            'Compliance-ready Templates',
            'Priority Support',
            'Unlimited Invoices',
        ],
        cta: 'Start CA Pro',
        variantEnvKey: 'VITE_LS_VARIANT_CA_PRO',
    },
    {
        slug: 'enterprise',
        name: 'Enterprise',
        tagline: 'Custom solutions at scale',
        price: null,
        priceAnnual: null,
        icon: Building2,
        gradient: 'from-emerald-500 to-teal-700',
        borderColor: 'border-emerald-200',
        bgTint: 'bg-emerald-50/20',
        features: [
            'Everything in SMB',
            'Unlimited AI Requests',
            'Custom Integrations',
            'Dedicated Account Manager',
            'SLA Guarantee',
            'Custom Reports',
        ],
        cta: 'Contact Sales',
    },
];

// ═══════════════════════════════════════════════════════════════════════
//  Pricing Page Component
// ═══════════════════════════════════════════════════════════════════════

const PricingPage = () => {
    const { user } = useAuth();
    const { planStatus } = useSubscription();
    const { businessType } = usePersona();
    const [isAnnual, setIsAnnual] = useState(false);
    const [loadingTier, setLoadingTier] = useState<string | null>(null);

    const currentTier = planStatus?.plan_tier || 'starter';

    // Suggest a recommended tier based on businessType
    const getRecommended = (): PlanTier => {
        if (businessType === 'ca_firm') return 'ca_pro';
        if (businessType === 'services_firm' || businessType === 'subscription') return 'smb';
        return 'freelancer';
    };
    const recommended = getRecommended();

    const handleCheckout = (tier: TierCard) => {
        if (tier.slug === 'enterprise') {
            window.open('mailto:hello@capita.ai?subject=Enterprise%20Plan%20Inquiry', '_blank');
            return;
        }

        if (tier.slug === currentTier || tier.slug === 'starter') return;

        setLoadingTier(tier.slug);

        const STORE_SLUG = import.meta.env.VITE_LEMON_SQUEEZY_STORE_SLUG;
        const VARIANT_ID = tier.variantEnvKey
            ? import.meta.env[tier.variantEnvKey] || import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_ID
            : import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_ID;

        if (!STORE_SLUG || !VARIANT_ID) {
            alert('Billing is not configured yet. Please contact support.');
            setLoadingTier(null);
            return;
        }

        const organizationId = localStorage.getItem('sb-org-id') || '';
        const email = user?.email || '';

        if (!organizationId || !email) {
            alert('Missing user data. Please log out and log back in.');
            setLoadingTier(null);
            return;
        }

        const checkoutUrl = `https://${STORE_SLUG}.lemonsqueezy.com/checkout/buy/${VARIANT_ID}?checkout[custom][organization_id]=${organizationId}&checkout[email]=${email}`;
        window.location.href = checkoutUrl;
    };

    const formatPrice = (tier: TierCard) => {
        if (tier.priceLabel) return tier.priceLabel;
        if (tier.price === null) return 'Custom';
        if (tier.price === 0) return 'Free';
        if (isAnnual && tier.priceAnnual) {
            return `₹${Math.round(tier.priceAnnual / 12).toLocaleString()}`;
        }
        return `₹${tier.price.toLocaleString()}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* ─── Header ─── */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 mb-6">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">Pricing Plans</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-text-main tracking-tight">
                        Scale your business,{' '}
                        <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                            not your costs
                        </span>
                    </h1>
                    <p className="mt-4 text-lg text-text-muted max-w-2xl mx-auto">
                        Choose the plan that matches your business stage. Upgrade or downgrade anytime.
                    </p>

                    {/* ─── Monthly / Annual Toggle ─── */}
                    <div className="mt-10 inline-flex items-center gap-4 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${!isAnnual
                                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${isAnnual
                                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/20'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            Annual
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                                Save 17%
                            </span>
                        </button>
                    </div>
                </div>

                {/* ─── Tier Cards ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {TIERS.map((tier) => {
                        const isCurrentPlan = tier.slug === currentTier;
                        const isRecommended = tier.slug === recommended && !isCurrentPlan;
                        const isBelowCurrent = TIERS.findIndex(t => t.slug === tier.slug) < TIERS.findIndex(t => t.slug === currentTier);

                        return (
                            <div
                                key={tier.slug}
                                className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${tier.bgTint} border-2 ${isRecommended
                                    ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                                    : isCurrentPlan
                                        ? 'border-green-300 shadow-lg'
                                        : `${tier.borderColor} shadow-md`
                                    }`}
                            >
                                {/* Badge */}
                                {isRecommended && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <span className="px-4 py-1 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/30">
                                            Recommended
                                        </span>
                                    </div>
                                )}
                                {isCurrentPlan && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                                        <span className="px-4 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                            Current Plan
                                        </span>
                                    </div>
                                )}

                                {/* Icon + Name */}
                                <div className="mt-3 mb-4">
                                    <div className={`inline-flex p-2.5 rounded-2xl bg-gradient-to-br ${tier.gradient} shadow-lg mb-4`}>
                                        <tier.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-main">{tier.name}</h3>
                                    <p className="text-xs text-text-muted mt-1">{tier.tagline}</p>
                                </div>

                                {/* Price */}
                                <div className="mb-6">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold text-text-main">
                                            {formatPrice(tier)}
                                        </span>
                                        {tier.price !== null && tier.price > 0 && !tier.priceLabel && (
                                            <span className="text-sm text-text-muted font-medium">/mo</span>
                                        )}
                                    </div>
                                    {isAnnual && tier.priceAnnual && (
                                        <p className="text-xs text-green-600 font-semibold mt-1">
                                            Billed ₹{tier.priceAnnual.toLocaleString()}/year
                                        </p>
                                    )}
                                </div>

                                {/* Features */}
                                <ul className="space-y-3 mb-8 flex-1">
                                    {tier.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-text-main">
                                            <div className={`p-0.5 rounded-full bg-gradient-to-br ${tier.gradient} mt-0.5 flex-shrink-0`}>
                                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                            </div>
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                    {tier.notIncluded?.map((f, i) => (
                                        <li key={`no-${i}`} className="flex items-start gap-2.5 text-sm text-gray-400">
                                            <X className="w-4 h-4 mt-0.5 flex-shrink-0" strokeWidth={2} />
                                            <span className="line-through">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                <button
                                    onClick={() => handleCheckout(tier)}
                                    disabled={isCurrentPlan || isBelowCurrent || loadingTier === tier.slug}
                                    className={`w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${isCurrentPlan
                                        ? 'bg-green-50 text-green-600 border-2 border-green-200 cursor-default'
                                        : isBelowCurrent
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : isRecommended
                                                ? `bg-gradient-to-r from-primary to-primary-dark text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5`
                                                : `bg-white border-2 ${tier.borderColor} text-text-main hover:shadow-lg hover:-translate-y-0.5`
                                        }`}
                                >
                                    {loadingTier === tier.slug ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : isCurrentPlan ? (
                                        <>
                                            <Check className="w-4 h-4" /> Active
                                        </>
                                    ) : (
                                        <>
                                            {tier.cta} <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* ─── Trust Bar ─── */}
                <div className="mt-16 text-center">
                    <div className="flex items-center justify-center gap-6 text-text-muted">
                        <div className="flex items-center gap-2 text-sm">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span>Secure Payment via Lemon Squeezy</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300" />
                        <div className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Cancel Anytime</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300" />
                        <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-green-500" />
                            <span>Instant Activation</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
