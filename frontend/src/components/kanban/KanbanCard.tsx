'use client';

import { Initiative } from '@/types/initiative';
import { Calendar, User, Target, CheckCircle, ArrowRight, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface KanbanCardProps {
  initiative: Initiative;
  onStatusChange?: (initiativeId: string, newStatus: string) => void;
  onViewDetails?: (initiativeId: string) => void;
}

export default function KanbanCard({ initiative, onStatusChange, onViewDetails }: KanbanCardProps) {
  const router = useRouter();
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mandates': return 'bg-red-100 text-red-800';
      case 'performance': return 'bg-yellow-100 text-yellow-800';
      case 'value-prop': return 'bg-green-100 text-green-800';
      case 'new-product': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'AR': '🇦🇷',
      'BR': '🇧🇷',
      'MX': '🇲🇽',
      'CL': '🇨🇱',
      'CO': '🇨🇴',
      'ROLA': '🌎',
      'cross-country': '🌍'
    };
    return flags[country] || '🏴';
  };

  const getAvailableActions = () => {
    const currentUser = 'Admin'; // TODO: Get from auth context
    const actions = [];

    switch (initiative.status) {
      case 'loaded':
        // Creator can close directly after seeing summary
        if (currentUser === initiative.createdBy || currentUser === 'Admin') {
          actions.push({ 
            label: 'Ver resumen y cerrar', 
            action: () => onViewDetails?.(initiative.id),
            icon: Eye,
            color: 'bg-blue-500 hover:bg-blue-600' 
          });
        }
        // Business can take for review
        actions.push({ 
          label: 'Tomar para revisión', 
          action: () => onStatusChange?.(initiative.id, 'business-review'),
          icon: ArrowRight,
          color: 'bg-green-500 hover:bg-green-600' 
        });
        break;
        
      case 'business-review':
        actions.push({ 
          label: 'Pasar a evaluación técnica', 
          action: () => onStatusChange?.(initiative.id, 'product-review'),
          icon: ArrowRight,
          color: 'bg-purple-500 hover:bg-purple-600' 
        });
        break;
        
      case 'product-review':
        actions.push({ 
          label: 'Cerrar evaluación', 
          action: () => onStatusChange?.(initiative.id, 'closure'),
          icon: CheckCircle,
          color: 'bg-orange-500 hover:bg-orange-600' 
        });
        break;
        
      case 'closure':
        actions.push({ 
          label: 'Aplicar ponderación', 
          action: () => onStatusChange?.(initiative.id, 'scoring'),
          icon: ArrowRight,
          color: 'bg-indigo-500 hover:bg-indigo-600' 
        });
        break;
        
      case 'scoring':
        actions.push({ 
          label: 'Priorizar Q1', 
          action: () => onStatusChange?.(initiative.id, 'prioritized'),
          icon: CheckCircle,
          color: 'bg-green-500 hover:bg-green-600' 
        });
        break;
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  const handleCardClick = () => {
    // Navigate to dedicated evaluation page
    if (['loaded', 'business-review', 'product-review'].includes(initiative.status)) {
      router.push(`/initiative/${initiative.id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
          {initiative.title}
        </h4>
        <span className="text-lg ml-2">
          {getCountryFlag(initiative.country)}
        </span>
      </div>

      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
        {initiative.summary}
      </p>

      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(initiative.category)}`}>
          {initiative.category.replace('-', ' ')}
        </span>
        {initiative.score && (
          <div className="flex items-center">
            <Target size={12} className="text-gray-400 mr-1" />
            <span className="text-xs font-semibold text-gray-900">
              {initiative.score}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <User size={12} className="mr-1" />
          <span>{initiative.createdBy}</span>
        </div>
        {initiative.quarter && (
          <div className="flex items-center">
            <Calendar size={12} className="mr-1" />
            <span>{initiative.quarter}</span>
          </div>
        )}
      </div>

      {initiative.effortEstimate && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Esfuerzo:</span>
            <span className={`text-xs font-medium px-2 py-1 rounded ${
              (initiative.effortEstimate || 0) <= 10 ? 'bg-green-100 text-green-800' :
              (initiative.effortEstimate || 0) <= 20 ? 'bg-yellow-100 text-yellow-800' :
              (initiative.effortEstimate || 0) <= 30 ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {initiative.effortEstimate}d
            </span>
          </div>
          {initiative.confidence && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Confianza:</span>
              <span className="text-xs font-medium text-gray-900">
                {initiative.confidence}%
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Action buttons */}
      {availableActions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          {availableActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  action.action();
                }}
                className={`w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-md transition-colors ${action.color}`}
              >
                <IconComponent size={14} className="mr-2" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}