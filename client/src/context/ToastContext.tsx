import React, { createContext, useContext, useState, useCallback } from 'react';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  title?: string;
}

interface ToastCtx {
  toast: (message: string, opts?: { type?: 'success' | 'error' | 'info'; title?: string }) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, opts?: { type?: 'success' | 'error' | 'info'; title?: string }) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type: opts?.type ?? 'success', title: opts?.title }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-md px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slideUp rounded-lg px-4 py-3 shadow-lg text-white text-sm font-medium ${
              t.type === 'success' ? 'bg-accent-600' : t.type === 'error' ? 'bg-red-600' : 'bg-ink-800'
            }`}
          >
            {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
