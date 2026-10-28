import React from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useUIStore } from '../../stores/uiStore';
import { Toast } from '../ui/Toast';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-900">
          {children}
        </main>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-40">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
};
