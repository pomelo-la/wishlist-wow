'use client';

import { useState } from 'react';
import { BarChart3, Columns, User } from 'lucide-react';

interface HeaderProps {
  activeView: 'dashboard' | 'kanban';
  onViewChange: (view: 'dashboard' | 'kanban') => void;
}

export default function Header({ activeView, onViewChange }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-lg mr-3">
            <BarChart3 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">FinTech Initiatives</h1>
            <p className="text-sm text-gray-500">Gestión de iniciativas</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'dashboard'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 size={18} className="mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => onViewChange('kanban')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'kanban'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Columns size={18} className="mr-2" />
            Kanban
          </button>
        </nav>

        {/* User Menu */}
        <div className="flex items-center">
          <button className="flex items-center text-gray-600 hover:text-gray-900">
            <User size={20} className="mr-2" />
            <span className="text-sm font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}