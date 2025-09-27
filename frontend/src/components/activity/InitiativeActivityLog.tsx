'use client';

import { useState } from 'react';
import { Calendar, User, BarChart3, FileText, Clock, Zap } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'evaluate' | 'status_change' | 'comment';
  title: string;
  description: string;
  user: string;
  timestamp: Date;
}

export default function InitiativeActivityLog() {
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      type: 'status_change',
      title: 'Estado actualizado',
      description: 'De "Nueva" a "En evaluación"',
      user: 'Ana Torres',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    {
      id: '2',
      type: 'comment',
      title: 'Comentario agregado',
      description: 'Esta iniciativa es crítica para el cumplimiento regulatorio en Brasil.',
      user: 'Ana Silva',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      id: '3',
      type: 'comment',
      title: 'Comentario técnico',
      description: 'La implementación técnica es compleja pero factible. Estimamos 3-4 sprints.',
      user: 'Carlos Mendoza',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      id: '4',
      type: 'update',
      title: 'Iniciativa actualizada',
      description: 'Ajustes en categoría y estimación de esfuerzo',
      user: 'Juan Perez',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '5',
      type: 'create',
      title: 'Iniciativa creada',
      description: 'Iniciativa creada mediante el flujo de intake',
      user: 'María García',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    }
  ]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'create':
        return <Zap className="text-green-500" size={14} />;
      case 'update':
        return <FileText className="text-blue-500" size={14} />;
      case 'evaluate':
        return <BarChart3 className="text-purple-500" size={14} />;
      case 'status_change':
        return <Calendar className="text-orange-500" size={14} />;
      case 'comment':
        return <User className="text-gray-500" size={14} />;
      default:
        return <FileText className="text-gray-500" size={14} />;
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
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Activity Log</h3>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start p-3 rounded-lg border ${getActivityColor(activity.type)} transition-all hover:shadow-sm`}
          >
            <div className="flex-shrink-0 mr-3 mt-0.5">
              {getActivityIcon(activity.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {activity.title}
                </h4>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={10} className="mr-1" />
                  {formatTime(activity.timestamp)}
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-2">
                {activity.description}
              </p>

              <div className="flex items-center text-xs text-gray-500">
                <User size={10} className="mr-1" />
                {activity.user}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200">
        <button className="w-full text-xs text-gray-500 hover:text-gray-700 font-medium py-2">
          Ver toda la actividad...
        </button>
      </div>
    </div>
  );
}