import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Database, Play, CheckCircle2, Terminal, Package, Users, FileText, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function StressTest() {
    const [dbStats, setDbStats] = useState({ products: 0, customers: 0, invoices: 0, ledger: 0 });
    const [loadingStats, setLoadingStats] = useState(true);
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [progress, setProgress] = useState(0);

    const fetchStats = async () => {
        try {
            const response = await dataService.getDbVolume() as any;
            setDbStats(response);
        } catch (err) {
            addLog('❌ Failed to fetch database volume');
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const handleRunTest = async () => {
        setRunning(true);
        setProgress(10);
        addLog('🚀 Initiating 512MB RAM Stress Test...');
        addLog('📦 Requesting backend to generate bulk data clusters...');

        try {
            const response = await dataService.runStressTest({
                productsCount: 500,
                customersCount: 1000,
                invoicesCount: 2500
            }) as any;

            setProgress(100);
            addLog(`✅ SUCCESS: ${response.summary.productsGenerated} Products, ${response.summary.customersGenerated} Customers, ${response.summary.invoicesGenerated} Invoices created.`);
            fetchStats();
        } catch (err) {
            addLog('❌ ERROR: Stress test interrupted. Resource limit or timeout.');
        } finally {
            setRunning(false);
            setTimeout(() => setProgress(0), 2000);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px] mb-1">
                        <Gauge size={14} className="animate-pulse" />
                        System Performance
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">RAM Stress Diagnostic</h1>
                    <p className="text-gray-500 mt-1">Infrastructure density test for 512MB memory environments.</p>
                </div>

                <button
                    onClick={handleRunTest}
                    disabled={running}
                    className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl ${running
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20 active:scale-95'
                        }`}
                >
                    {running ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                    {running ? 'Executing...' : 'Trigger Full Stress'}
                </button>
            </div>

            {/* Database Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Cloud Products', value: dbStats.products, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Customers', value: dbStats.customers, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Invoice Nodes', value: dbStats.invoices, icon: FileText, color: 'text-primary', bg: 'bg-primary/5' },
                    { label: 'Ledger Entries', value: dbStats.ledger, icon: Database, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                ].map((item) => (
                    <motion.div
                        key={item.label}
                        whileHover={{ y: -4 }}
                        className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4"
                    >
                        <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</div>
                            <div className="text-2xl font-black text-gray-900">
                                {loadingStats ? '--' : item.value.toLocaleString()}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Logs & Control */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-gray-900 rounded-[2.5rem] p-6 shadow-2xl overflow-hidden flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest">
                            <Terminal size={14} />
                            Optimization Feed (Live)
                        </div>
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                            <div className="w-3 h-3 rounded-full bg-green-500/20" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto font-mono text-xs space-y-2 custom-scrollbar pr-2">
                        {logs.length === 0 && (
                            <div className="text-gray-600 italic">Ready for diagnostics... Waiting for instruction.</div>
                        )}
                        {logs.map((log, i) => (
                            <div key={i} className={`${log.includes('✅') ? 'text-primary' : log.includes('❌') ? 'text-red-400' : 'text-gray-400'}`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-full">
                        <div className="text-xs font-black uppercase tracking-widest text-gray-900 mb-4">Environment Profile</div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-2xl">
                                <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Node</div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-gray-700">Max RAM</span>
                                    <span className="bg-gray-900 text-white px-2 py-0.5 rounded-lg text-xs font-black">512MB</span>
                                </div>
                            </div>

                            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest mb-2">Simulated Pressure</div>
                                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${running ? Math.max(progress, 15) : 12}%` }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-[10px] font-bold text-primary italic">
                                    <span>Idle</span>
                                    <span>{running ? 'Peak Load' : 'Stable'}</span>
                                </div>
                            </div>

                            <div className="p-5 border-t border-gray-50 pt-6">
                                <h4 className="text-xs font-black text-gray-900 uppercase mb-3">Diagnostic Rules</h4>
                                <ul className="space-y-3">
                                    {[
                                        'Database population bypassing validation cache.',
                                        'Direct Postgres injection for maximum throughput.',
                                        'Frontend concurrent rendering check.',
                                        'Asset lazy-loading threshold evaluation.'
                                    ].map((rule, idx) => (
                                        <li key={idx} className="flex gap-2 text-[11px] text-gray-500 font-medium">
                                            <CheckCircle2 size={14} className="text-primary flex-shrink-0" />
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
