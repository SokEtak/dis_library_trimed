import { useEffect, useRef } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
  type?: 'success' | 'error' | 'info';
}

export default function Toast({ message, show, onClose, type = 'info' }: ToastProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (show) {
      const timer = window.setTimeout(() => {
        onCloseRef.current();
      }, 2500);

      return () => window.clearTimeout(timer);
    }
  }, [show, message, type]);

  if (!show) return null;

  let bgColor = 'bg-blue-600';
  if (type === 'success') bgColor = 'bg-emerald-600';
  if (type === 'error') bgColor = 'bg-rose-600';

  return (
    <div className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg px-6 py-3 text-white shadow-lg transition-all ${bgColor}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
