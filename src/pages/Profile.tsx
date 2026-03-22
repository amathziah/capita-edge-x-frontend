import { User, Building2, Shield, Mail, Hash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePersona } from '../contexts/PersonaContext';

export function Profile() {
    const { user } = useAuth();
    const { organizationId, loading: personaLoading, refreshPersona } = usePersona();
    // Safe access to role from the enriched user object
    const role = (user as any)?.role || 'User';

    return (
        <div className="p-6 lg:p-10 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-text-main flex items-center gap-3">
                    <User className="w-7 h-7 text-primary" />
                    My Profile
                </h2>
                <p className="text-text-muted mt-1">Manage your personal account information.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
                {/* Header/Banner */}
                <div className="h-32 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-gray-100 relative">
                    <div className="absolute -bottom-10 left-8">
                        <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg border border-gray-100">
                            <div className="w-full h-full bg-primary-light rounded-xl flex items-center justify-center text-primary text-3xl font-bold">
                                {user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-14 px-8 pb-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-text-main">{user?.email?.split('@')[0]}</h3>
                            <p className="text-sm text-text-muted">{user?.email}</p>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full border border-primary/20 uppercase tracking-wide">
                            {role}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5" />
                                Email Address
                            </label>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-text-main font-medium">
                                {user?.email}
                            </div>
                        </div>

                        {/* User ID Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Hash className="w-3.5 h-3.5" />
                                User ID
                            </label>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-text-muted font-mono truncate" title={user?.id}>
                                {user?.id}
                            </div>
                        </div>

                        {/* Organization Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5" />
                                Organization ID
                            </label>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-text-muted font-mono truncate">
                                {organizationId}
                            </div>
                        </div>

                        {/* Role Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" />
                                Account Role
                            </label>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-text-main font-medium capitalize">
                                {role} account
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
