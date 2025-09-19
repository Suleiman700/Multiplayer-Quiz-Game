'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket-client';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

export const NotificationToast: React.FC = () => {
  const { error } = useSocket();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Add error toast when socket error occurs
  useEffect(() => {
    if (error) {
      addToast(error, 'error');
    }
  }, [error]);

  const addToast = (message: string, type: Toast['type'], duration = 5000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            max-w-sm w-full bg-white rounded-lg shadow-lg border p-4 animate-slide-up
            ${toast.type === 'success' ? 'border-success-200 bg-success-50' : ''}
            ${toast.type === 'error' ? 'border-danger-200 bg-danger-50' : ''}
            ${toast.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
            ${toast.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
          `}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {toast.type === 'success' && (
                <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {toast.type === 'error' && (
                <svg className="w-5 h-5 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {toast.type === 'warning' && (
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              {toast.type === 'info' && (
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 w-0 flex-1">
              <p className={`
                text-sm font-medium
                ${toast.type === 'success' ? 'text-success-800' : ''}
                ${toast.type === 'error' ? 'text-danger-800' : ''}
                ${toast.type === 'warning' ? 'text-yellow-800' : ''}
                ${toast.type === 'info' ? 'text-blue-800' : ''}
              `}>
                {toast.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => removeToast(toast.id)}
                className={`
                  inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
