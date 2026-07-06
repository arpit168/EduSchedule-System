import { Loader2, Inbox, AlertOctagon, ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Button from './Button';

export const Loader = ({ text = 'Loading...', fullScreen = false, className = '' }) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
        <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 absolute animate-pulse" />
      </div>
      {text && <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`}
      {...props}
    />
  );
};

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No Data Found',
  description = 'There are no items to display at the moment.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'We encountered an error while loading this data. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-12 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-3xl ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4 shadow-inner">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200">{title}</h3>
      <p className="text-sm text-rose-600 dark:text-rose-400 max-w-sm mt-1">{description}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="danger" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};

export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variants = {
    primary: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60',
    danger: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60',
    info: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60',
  };

  const dotColors = {
    primary: 'bg-indigo-500',
    secondary: 'bg-slate-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-blue-500',
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.primary}`} />}
      <span>{children}</span>
    </span>
  );
};

export const Tooltip = ({ children, content, position = 'top', className = '' }) => {
  return (
    <div className={`group relative inline-flex ${className}`}>
      {children}
      <div className={`
        absolute z-50 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-lg shadow-lg
        opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap
        ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''}
        ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-1' : ''}
        ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
        ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-1' : ''}
      `}>
        {content}
      </div>
    </div>
  );
};

export const Breadcrumbs = ({ customItems = null, className = '' }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNames = {
    dashboard: 'Dashboard',
    teachers: 'Teachers',
    subjects: 'Subjects',
    classes: 'Classes',
    rooms: 'Rooms',
    departments: 'Departments',
    assignments: 'Assignments',
    timetables: 'Timetables',
    reports: 'Reports',
    profile: 'Profile',
    settings: 'Settings',
  };

  const items = customItems || [
    { label: 'Home', path: '/', icon: Home },
    ...pathnames.map((name, idx) => {
      const path = `/${pathnames.slice(0, idx + 1).join('/')}`;
      return {
        label: routeNames[name.toLowerCase()] || name.charAt(0).toUpperCase() + name.slice(1),
        path,
        isLast: idx === pathnames.length - 1,
      };
    }),
  ];

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 ${className}`}>
      <ol className="flex items-center gap-1.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={item.path || idx} className="flex items-center gap-1.5">
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
              {item.isLast ? (
                <span className="text-slate-900 dark:text-white font-bold flex items-center gap-1">
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default {
  Loader,
  Skeleton,
  EmptyState,
  ErrorState,
  Badge,
  Tooltip,
  Breadcrumbs,
};
