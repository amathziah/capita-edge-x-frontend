import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/app/providers/DataContext';

export function RefreshingIndicator() {
  const { loading, invoices, payments, customers, expenses, products } = useData();
  
  // Only show if loading is true AND we have some data already (background refresh)
  const hasSomeData = invoices.length > 0 || payments.length > 0 || customers.length > 0 || expenses.length > 0 || products.length > 0;
  
  return (
    <AnimatePresence>
      {loading && hasSomeData && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-emerald-500 overflow-hidden"
        >
          <motion.div
            className="h-full bg-emerald-300"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
