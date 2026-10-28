import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { toggleSidebar, darkMode, toggleDarkMode } = useUIStore();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <Menu size={24} className="dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">InsightFlow AI</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
