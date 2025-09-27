'use client';

import { useState } from 'react';
import { BarChart3, Columns, User, Plus, Search, X, TrendingUp } from 'lucide-react';

interface HeaderProps {
  activeView: 'dashboard' | 'kanban' | 'intake';
  onViewChange: (view: 'dashboard' | 'kanban' | 'intake') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export default function Header({ activeView, onViewChange, searchQuery = '', onSearchChange }: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <div className="mr-3">
            <img 
              src="/wishlist-logo.svg" 
              alt="Wishlist Logo" 
              className="w-10 h-10"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Wishlist-wow</h1>
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
          <button
            onClick={() => onViewChange('intake')}
            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'intake'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus size={18} className="mr-2" />
            Nueva Iniciativa
          </button>
        </nav>

        {/* Search and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <div className={`relative transition-all duration-200 ${
              isSearchFocused ? 'w-80' : 'w-64'
            }`}>
              <Search 
                size={18} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              <input
                type="text"
                placeholder="Buscar iniciativas..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* User Menu */}
          <button className="flex items-center text-gray-600 hover:text-gray-900">
            <User size={20} className="mr-2" />
            <span className="text-sm font-medium">Admin</span>
          </button>
        </div>
      </div>
    </header>
  );
}