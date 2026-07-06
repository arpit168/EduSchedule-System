import { useState, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle, ChevronDown } from 'lucide-react';

export const Input = forwardRef(({
  label,
  error,
  type = 'text',
  required = false,
  helperText,
  className = '',
  containerClassName = '',
  icon: Icon = null,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 select-none">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`
            w-full bg-white dark:bg-slate-900 border ${error ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500/20'}
            text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-xl py-2.5
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${isPassword ? 'pr-10' : 'pr-3.5'}
            transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5 animate-in fade-in duration-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{helperText}</p>
      )}
    </div>
  );
});
Input.displayName = 'Input';

export const Select = forwardRef(({
  label,
  error,
  required = false,
  helperText,
  options = [],
  children,
  className = '',
  containerClassName = '',
  icon: Icon = null,
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 select-none">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <select
          ref={ref}
          className={`
            w-full bg-white dark:bg-slate-900 border ${error ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500/20'}
            text-slate-900 dark:text-white text-sm rounded-xl py-2.5 appearance-none cursor-pointer
            ${Icon ? 'pl-10' : 'pl-3.5'} pr-10
            transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5 animate-in fade-in duration-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{helperText}</p>
      )}
    </div>
  );
});
Select.displayName = 'Select';

export const Textarea = forwardRef(({
  label,
  error,
  required = false,
  helperText,
  rows = 3,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1 select-none">
          <span>{label}</span>
          {required && <span className="text-rose-500 font-bold">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full bg-white dark:bg-slate-900 border ${error ? 'border-rose-500 dark:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-indigo-500/20'}
          text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm rounded-xl p-3.5
          transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed custom-scrollbar
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-rose-500 font-medium flex items-center gap-1 mt-0.5 animate-in fade-in duration-200">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{helperText}</p>
      )}
    </div>
  );
});
Textarea.displayName = 'Textarea';

export const Checkbox = forwardRef(({ label, error, className = '', containerClassName = '', ...props }, ref) => {
  return (
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <input
          ref={ref}
          type="checkbox"
          className={`
            w-4 h-4 rounded-md border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:focus:ring-offset-slate-900
            transition duration-150 ease-in-out cursor-pointer
            ${className}
          `}
          {...props}
        />
        {label && <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{label}</span>}
      </label>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
});
Checkbox.displayName = 'Checkbox';

export const Switch = forwardRef(({ label, checked, onChange, disabled = false, className = '', containerClassName = '', ...props }, ref) => {
  return (
    <div className={`flex items-center justify-between gap-3 ${containerClassName}`}>
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none">{label}</span>}
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange && onChange(!checked)}
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}
          ${className}
        `}
        {...props}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
});
Switch.displayName = 'Switch';
