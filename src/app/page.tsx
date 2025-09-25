'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Dashboard from '@/components/dashboard/Dashboard';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import IntakeChat from '@/components/intake/IntakeChat';

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'kanban' | 'intake'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeView={activeView} onViewChange={setActiveView} />
      
      <main className="container mx-auto px-6 py-8">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'kanban' && (
          <div className="h-[calc(100vh-12rem)]">
            <KanbanBoard />
          </div>
        )}
        {activeView === 'intake' && (
          <div className="h-[calc(100vh-12rem)] bg-white rounded-lg shadow-sm">
            <IntakeChat />
          </div>
        )}
      </main>
    </div>
  );
}
