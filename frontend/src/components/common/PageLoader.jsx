import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {message}
        </p>
      </div>
    </motion.div>
  );
};

export default PageLoader;
