import { useState, useEffect } from 'react';
import { Check, X, Zap, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const PricingPage = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [organizationId, setOrganizationId] = useState('');

    useEffect(() => {
        // Fetch current plan and user details
        const fetchPlan = async () => {
            const orgId = localStorage.getItem('sb-org-id');
            setOrganizationId(orgId || '');

            if (user?.email) {
                setEmail(user.email);
            }
        };

        fetchPlan();
    }, [user]);

    const handleUpgrade = () => {
        setIsLoading(true);

        // LEMON SQUEEZY CONFIG
        const STORE_SLUG = import.meta.env.VITE_LEMON_SQUEEZY_STORE_SLUG;
        const VARIANT_ID = import.meta.env.VITE_LEMON_SQUEEZY_VARIANT_ID;

        if (!STORE_SLUG || !VARIANT_ID) {
            alert('Billing is not configured yet.');
            setIsLoading(false);
            return;
        }

        console.log('--- LEMON SQUEEZY DEBUG ---');
        console.log('Store Slug:', STORE_SLUG);
        console.log('Variant ID:', VARIANT_ID);
        console.log('Org ID:', organizationId);
        console.log('Email:', email);

        // Construct Checkout URL with Custom Data
        // We pass organization_id so the webhook knows which org to upgrade
        const checkoutUrl = `https://${STORE_SLUG}.lemonsqueezy.com/checkout/buy/${VARIANT_ID}?checkout[custom][organization_id]=${organizationId}&checkout[email]=${email}`;

        console.log('Generated URL:', checkoutUrl);

        if (!organizationId || !email) {
            console.warn('MISSING DATA: Org ID or Email is missing!');
            alert('Missing user data. Please log out and log back in.');
            setIsLoading(false);
            return;
        }

        window.location.href = checkoutUrl;
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Simple, Transparent Pricing
                    </h2>
                    <p className="mt-4 text-xl text-gray-600">
                        Choose the plan that fits your business needs.
                    </p>
                </div>

                <div className="mt-16 grid gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
                    {/* FREE TIER */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col">
                        <div className="mb-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                Starter
                            </span>
                        </div>
                        <h3 className="text-4xl font-bold text-gray-900 mb-2">Free</h3>
                        <p className="text-gray-500 mb-6">Perfect for freelancers just starting out.</p>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-gray-600">
                                <Check className="h-5 w-5 text-green-500 mr-3" />
                                Up to 5 Invoices per month
                            </li>
                            <li className="flex items-center text-gray-600">
                                <Check className="h-5 w-5 text-green-500 mr-3" />
                                Basic CRM (Customers & Products)
                            </li>
                            <li className="flex items-center text-gray-600">
                                <Check className="h-5 w-5 text-green-500 mr-3" />
                                Email Support
                            </li>
                            <li className="flex items-center text-gray-400">
                                <X className="h-5 w-5 mr-3" />
                                AI Insights & Automation
                            </li>
                        </ul>

                        <button
                            disabled={true}
                            className="w-full py-3 px-6 rounded-xl bg-gray-100 text-gray-400 font-medium cursor-not-allowed"
                        >
                            Current Plan
                        </button>
                    </div>

                    {/* PRO TIER */}
                    <div className="bg-white rounded-2xl shadow-xl border border-primary/20 p-8 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4">
                            <Zap className="h-24 w-24 text-primary/5 -rotate-12" />
                        </div>

                        <div className="mb-4 relative">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                Recommended
                            </span>
                        </div>
                        <div className="flex items-baseline mb-2 relative">
                            <h3 className="text-4xl font-bold text-gray-900">₹999</h3>
                            <span className="text-gray-500 ml-2">/month</span>
                        </div>
                        <p className="text-gray-500 mb-6 relative">For growing businesses that need power.</p>

                        <ul className="space-y-4 mb-8 flex-1 relative">
                            <li className="flex items-center text-gray-800 font-medium">
                                <div className="p-1 rounded-full bg-green-100 mr-3">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                Unlimited Invoices
                            </li>
                            <li className="flex items-center text-gray-800">
                                <div className="p-1 rounded-full bg-green-100 mr-3">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                AI Business Assistant (Gemini Pro)
                            </li>
                            <li className="flex items-center text-gray-800">
                                <div className="p-1 rounded-full bg-green-100 mr-3">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                Automated Payment Reminders
                            </li>
                            <li className="flex items-center text-gray-800">
                                <div className="p-1 rounded-full bg-green-100 mr-3">
                                    <Check className="h-4 w-4 text-green-600" />
                                </div>
                                Priority Support
                            </li>
                        </ul>

                        <button
                            onClick={handleUpgrade}
                            disabled={isLoading}
                            className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25 relative flex justify-center items-center"
                        >
                            {isLoading ? 'Redirecting...' : 'Upgrade to Pro'}
                        </button>

                        <div className="mt-4 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center">
                                <Shield className="h-3 w-3 mr-1" />
                                Secure payment via Lemon Squeezy
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
