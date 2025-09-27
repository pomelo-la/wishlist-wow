'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, BarChart3, FileText, Clock, Zap } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'evaluate' | 'status_change' | 'comment';
  title: string;
  description: string;
  user: string;
  timestamp: Date;
  initiativeTitle?: string;
}

export default function ActivityLog() {
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'create',
      title: 'Nueva iniciativa creada',
      description: 'Sistema de pagos móviles para Colombia',
      user: 'María García',
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      initiativeTitle: 'Pagos móviles Colombia'
    },
    {
      id: '2',
      type: 'evaluate',
      title: 'Evaluación completada',
      description: 'Evaluación finalizada con score de 85/100',
      user: 'Carlos Mendez',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      initiativeTitle: 'API Gateway v2'
    },
    {
      id: '3',
      type: 'status_change',
      title: 'Estado actualizado',
      description: 'De "En evaluación" a "Aprobado"',
      user: 'Ana Torres',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      initiativeTitle: 'Microcréditos Brasil'
    },
    {
      id: '4',
      type: 'update',
      title: 'Iniciativa actualizada',
      description: 'Ajustes en estimación de esfuerzo',
      user: 'Juan Perez',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      initiativeTitle: 'Dashboard Analytics'
    },
    {
      id: '5',
      type: 'comment',
      title: 'Comentario agregado',
      description: 'Revisión técnica necesaria antes de implementación',
      user: 'Laura Silva',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      initiativeTitle: 'Sistema de notificaciones'
    },
    {
      id: '6',
      type: 'create',
      title: 'Nueva iniciativa creada',
      description: 'Implementación de blockchain para transacciones',
      user: 'Roberto Kim',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      initiativeTitle: 'Blockchain Transactions'
    }
  ]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return <Zap className="text-green-500" size={16} />;
      case 'update':
        return <FileText className="text-blue-500" size={16} />;
      case 'evaluate':
        return <BarChart3 className="text-purple-500" size={16} />;
      case 'status_change':
        return <Calendar className="text-orange-500" size={16} />;
      case 'comment':
        return <User className="text-gray-500" size={16} />;
      default:
        return <FileText className="text-gray-500" size={16} />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return 'bg-green-50 border-green-200';
      case 'update':
        return 'bg-blue-50 border-blue-200';
      case 'evaluate':
        return 'bg-purple-50 border-purple-200';
      case 'status_change':
        return 'bg-orange-50 border-orange-200';
      case 'comment':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity Log</h1>
          <p className="text-gray-600">Historial de actividades recientes del sistema</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start p-4 rounded-lg border ${getActivityColor(activity.type)} transition-all hover:shadow-sm`}
                >
                  <div className="flex-shrink-0 mr-4 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        {formatTime(activity.timestamp)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {activity.description}
                    </p>

                    <div className="flex items-center justify-between">
                      {activity.initiativeTitle && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          {activity.initiativeTitle}
                        </span>
                      )}

                      <div className="flex items-center text-xs text-gray-500">
                        <User size={12} className="mr-1" />
                        {activity.user}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium">
              Cargar más actividades...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}