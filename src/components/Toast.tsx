import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const styles = {
        success: "bg-emerald-50 text-emerald-800 border-emerald-100",
        error: "bg-red-50 text-red-800 border-red-100",
        info: "bg-blue-50 text-blue-800 border-blue-100"
    };

    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        info: <Info className="w-5 h-5 text-blue-500" />
    };

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-top-2 fade-in duration-300 ${styles[type]}`}>
            {icons[type]}
            <p className="font-medium text-sm">{message}</p>
            <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                <X className="w-4 h-4 opacity-50" />
            </button>
        </div>
    );
}
