import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
}

interface ConfirmState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleClose = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {state && (
              <ConfirmModal
                key="confirm-modal"
                title={state.title}
                message={state.message}
                confirmLabel={state.confirmLabel}
                cancelLabel={state.cancelLabel}
                variant={state.variant}
                onConfirm={() => handleClose(true)}
                onCancel={() => handleClose(false)}
              />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}

function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmOptions & { onConfirm: () => void; onCancel: () => void }) {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconBg = isDanger
    ? 'bg-red-50'
    : isWarning
    ? 'bg-amber-50'
    : 'bg-gray-50';

  const iconColor = isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-500';

  const btnStyle = isDanger
    ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_14px_-2px_rgba(239,68,68,0.4)]'
    : isWarning
    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-[0_4px_14px_-2px_rgba(245,158,11,0.4)]'
    : 'bg-gray-900 hover:bg-gray-800 text-white';

  const Icon = isDanger ? Trash2 : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative w-full max-w-[400px] rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg}`}>
            <Icon size={22} className={iconColor} strokeWidth={1.8} />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[15px] font-bold text-gray-900 leading-snug">{title}</h3>
            {message && (
              <p className="text-[13px] leading-[1.6] text-gray-500">{message}</p>
            )}
          </div>

          <div className="flex w-full gap-2.5 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all active:scale-[0.98] ${btnStyle}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
