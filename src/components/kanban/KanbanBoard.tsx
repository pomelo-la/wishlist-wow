'use client';

import { useState } from 'react';
import { mockInitiatives } from '@/data/mockData';
import KanbanCard from './KanbanCard';
import { Plus } from 'lucide-react';

export default function KanbanBoard() {
  const [initiatives] = useState(mockInitiatives);

  const statusConfig = [
    {
      key: 'loaded',
      title: 'Iniciativa Cargada',
      color: 'bg-yellow-50 border-yellow-200',
      headerColor: 'bg-yellow-100'
    },
    {
      key: 'business-review',
      title: 'Revisión Negocio',
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'bg-blue-100'
    },
    {
      key: 'product-review',
      title: 'Revisión Producto/Tech/UX',
      color: 'bg-purple-50 border-purple-200',
      headerColor: 'bg-purple-100'
    },
    {
      key: 'closure',
      title: 'Cierre',
      color: 'bg-orange-50 border-orange-200',
      headerColor: 'bg-orange-100'
    },
    {
      key: 'scoring',
      title: 'Ponderación',
      color: 'bg-indigo-50 border-indigo-200',
      headerColor: 'bg-indigo-100'
    },
    {
      key: 'prioritized',
      title: 'Priorizada',
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-100'
    }
  ];

  const getInitiativesByStatus = (status: string) => {
    return initiatives.filter(initiative => initiative.status === status);
  };

  return (
    <div className="h-full overflow-hidden">
      <div className="flex gap-6 h-full overflow-x-auto pb-6">
        {statusConfig.map((status) => {
          const statusInitiatives = getInitiativesByStatus(status.key);
          
          return (
            <div 
              key={status.key} 
              className={`flex-shrink-0 w-80 ${status.color} border rounded-lg`}
            >
              {/* Column Header */}
              <div className={`${status.headerColor} px-4 py-3 border-b border-gray-200 rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {status.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                      {statusInitiatives.length}
                    </span>
                    <button className="p-1 hover:bg-white hover:bg-opacity-50 rounded">
                      <Plus size={16} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Content */}
              <div className="p-4 space-y-4 h-[calc(100%-4rem)] overflow-y-auto">
                {statusInitiatives.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No hay iniciativas en esta etapa
                  </div>
                ) : (
                  statusInitiatives.map((initiative) => (
                    <KanbanCard
                      key={initiative.id}
                      initiative={initiative}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}