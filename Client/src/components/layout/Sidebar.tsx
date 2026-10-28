import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Upload,
  FolderOpen,
  BarChart3,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <Home size={20} /> },
  { label: 'Upload', path: '/upload', icon: <Upload size={20} /> },
  { label: 'Meetings', path: '/meetings', icon: <FolderOpen size={20} /> },
  { label: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen } = useUIStore();
  const location = useLocation();

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-gray-900 text-white transition-all duration-300 overflow-y-auto`}
    >
      <nav className="p-4 space-y-2">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              {item.icon}
              {sidebarOpen && (
                <span className="flex-1 text-sm font-medium">{item.label}</span>
              )}
              {sidebarOpen && isActive && <ChevronRight size={16} />}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
