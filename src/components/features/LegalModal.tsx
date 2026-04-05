import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type PolicyType = 'about' | 'contact' | 'terms' | 'privacy' | 'refund';

interface LegalModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: PolicyType | null;
}

const POLICY_CONTENT: Record<PolicyType, { title: string; content: React.ReactNode }> = {
    about: {
        title: "About Us",
        content: (
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>Welcome to CapitaEdgeX. We are a dedicated financial technology platform designed specifically for Indian marketing agencies, freelancers, and small businesses.</p>
                <p>Our mission is to simplify invoice management, payment collections, and financial compliance, ensuring that creative professionals can focus on their work rather than their accounts.</p>
                <p>Founded by Laboratory Capita, Inc., we strive to provide a seamlessly integrated Revenue OS that brings enterprise-level financial controls to growing agencies across India.</p>
            </div>
        )
    },
    contact: {
        title: "Contact Us",
        content: (
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>We are here to help! If you have any questions, concerns, or need support with your account, please reach out to us through the details below:</p>
                <div className="bg-white/[0.04] p-4 rounded-lg border border-white/[0.08] mt-4 space-y-3">
                    <div>
                        <strong className="text-white block mb-1">Operating Address:</strong>
                        123 Financial Hub, Tech Park Phase 2,<br/>
                        Mumbai, Maharashtra 400001,<br/>
                        India
                    </div>
                    <div>
                        <strong className="text-white block mb-1">Email Support:</strong>
                        <a href="mailto:support@capitaedgex.com" className="text-teal-400 hover:underline">support@capitaedgex.com</a>
                    </div>
                    <div>
                        <strong className="text-white block mb-1">Phone:</strong>
                        +91 98765 43210 (Available Mon-Fri, 10 AM to 6 PM IST)
                    </div>
                </div>
            </div>
        )
    },
    terms: {
        title: "Terms and Conditions",
        content: (
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                <h4 className="text-white font-bold mt-2">1. Introduction</h4>
                <p>These Terms and Conditions govern your use of the CapitaEdgeX platform and its integrated payment gateway services. By registering, you agree to be bound by these terms.</p>
                
                <h4 className="text-white font-bold mt-4">2. Services Provided</h4>
                <p>CapitaEdgeX provides invoicing, payment tracking, and financial analytics software. We facilitate payments via third-party gateways (e.g., Razorpay) but are not a banking institution.</p>

                <h4 className="text-white font-bold mt-4">3. User Responsibilities</h4>
                <p>You agree to provide accurate business and GST information. You are solely responsible for products or services sold using our invoicing tools.</p>

                <h4 className="text-white font-bold mt-4">4. Prohibited Activities</h4>
                <p>Users must not use the platform for unlawful purposes, fraudulent transactions, or selling restricted goods under Indian law.</p>

                <h4 className="text-white font-bold mt-4">5. Termination</h4>
                <p>We reserve the right to suspend or terminate accounts that violate these terms or fail to pass compliance checks enforced by our payment partners.</p>
            </div>
        )
    },
    privacy: {
        title: "Privacy Policy",
        content: (
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                <p>Your privacy is important to us. This policy outlines how Laboratory Capita, Inc. collects, uses, and protects your data.</p>
                
                <h4 className="text-white font-bold mt-4">1. Data Collection</h4>
                <p>We collect essential business information, contact details, and transaction data required to process invoices and payments effectively via partners like Razorpay.</p>

                <h4 className="text-white font-bold mt-4">2. Data Usage</h4>
                <p>Your data is used strictly for rendering our services, ensuring compliance with RBI/GST regulations, and improving platform stability. We do not sell your data to third parties.</p>

                <h4 className="text-white font-bold mt-4">3. Data Security</h4>
                <p>We employ industry-standard encryption and security protocols to safeguard your financial and personal data against unauthorized access.</p>

                <h4 className="text-white font-bold mt-4">4. Third-Party Sharing</h4>
                <p>We share necessary transaction data securely with payment gateways (e.g., Razorpay) strictly for the purpose of payment processing and fraud prevention.</p>
            </div>
        )
    },
    refund: {
        title: "Refund and Cancellation Policy",
        content: (
            <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                <h4 className="text-white font-bold mt-2">1. Subscription Cancellations</h4>
                <p>You may cancel your CapitaEdgeX platform subscription at any time. Cancellations will take effect at the end of your current billing cycle. We do not offer prorated refunds for mid-cycle cancellations.</p>
                
                <h4 className="text-white font-bold mt-4">2. Payment Gateway Transaction Refunds</h4>
                <p>For payments collected from your clients via our integrated payment gateway (e.g., Razorpay):</p>
                <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li>Refunds initiated by you back to your client will be processed strictly according to standard gateway timelines.</li>
                    <li>Once a refund is approved and initiated, the amount will be credited back to the customer's original payment method within <strong>5 to 7 working days</strong>.</li>
                    <li>Platform transaction fees applied to the original transaction may be non-refundable based on the gateway's active policy.</li>
                </ul>

                <h4 className="text-white font-bold mt-4">3. Dispute Resolution</h4>
                <p>If a client raises a chargeback or dispute, the funds may be held temporarily while the dispute is investigated by the payment partner.</p>
            </div>
        )
    }
};

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose, type }) => {
    if (!type) return null;

    const data = POLICY_CONTENT[type];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                        className="relative w-full max-w-2xl bg-[#0a0e1a] border border-[#1e2434] rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-[#1e2434] bg-[#0d1222]">
                            <h3 className="text-xl font-black text-white">{data.title}</h3>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 md:p-8 bg-[#0a0e1a]">
                            {data.content}
                        </div>
                        
                        {/* Footer */}
                        <div className="p-6 border-t border-[#1e2434] bg-[#0d1222] flex justify-end">
                            <button 
                                onClick={onClose}
                                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-sm font-bold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
