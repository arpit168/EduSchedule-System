import { useEffect } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import Button from './Button';

export const Modal = ({
  isOpen = false,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
  closeOnOutsideClick = true,
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={() => closeOnOutsideClick && onClose && onClose()}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`relative w-full ${maxWidth} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
            <div>
              {title && (
                <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ConfirmDeleteModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  itemName = '',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={!isLoading ? onClose : undefined}
      maxWidth="max-w-md"
      showCloseButton={!isLoading}
      closeOnOutsideClick={!isLoading}
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            {title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {message}
          </p>
          {itemName && (
            <div className="mt-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 break-all">
              "{itemName}"
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 w-full mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <Button
            variant="secondary"
            fullWidth
            disabled={isLoading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            fullWidth
            isLoading={isLoading}
            icon={Trash2}
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
