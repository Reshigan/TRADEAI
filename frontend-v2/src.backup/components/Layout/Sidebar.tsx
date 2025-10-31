import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Tag, 
  Users, 
  Package, 
  Wallet, 
  Receipt, 
  FileText,
  BarChart3,
  Grid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/cn';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Tag, label: 'Promotions', path: '/promotions' },
  { icon: Users, label: 'Customers', path: '/customers' },
  { icon: Package, label: 'Products', path: '/products' },
  { icon: Wallet, label: 'Budgets', path: '/budgets' },
  { icon: Receipt, label: 'Trade Spends', path: '/trade-spends' },
  { icon: FileText, label: 'Trading Terms', path: '/trading-terms' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Grid, label: 'Activity Grid', path: '/activity-grid' },
];

export const Sidebar: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => {
  const location = useLocation();

  return (
    <aside className={cn(
      'bg-gray-900 text-white h-screen transition-all duration-300 flex flex-col',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!collapsed && <span className="text-xl font-bold">Trade AI</span>}
        <button onClick={onToggle} className="p-2 hover:bg-gray-800 rounded-lg">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center px-4 py-3 transition-colors',
                isActive ? 'bg-primary-600 text-white' : 'text-gray-300 hover:bg-gray-800',
                collapsed && 'justify-center'
              )}
            >
              <Icon size={20} />
              {!collapsed && <span className="ml-3">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
