'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import IntakeChat from '@/components/intake/IntakeChat';

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'kanban' | 'intake'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'kanban', 'intake'].includes(tab)) {
      setActiveView(tab as 'dashboard' | 'kanban' | 'intake');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeView={activeView} 
        onViewChange={setActiveView}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      <main className="h-[calc(100vh-5rem)]">
        {activeView === 'dashboard' && (
          <div className="container mx-auto px-6 py-8 h-full overflow-y-auto">
            <UnifiedDashboard />
          </div>
        )}
        {activeView === 'kanban' && (
          <KanbanBoard searchQuery={searchQuery} />
        )}
        {activeView === 'intake' && (
          <div className="h-full">
            <IntakeChat />
          </div>
        )}
      </main>
    </div>
  );
}
