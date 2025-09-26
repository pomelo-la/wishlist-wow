'use client';

import { Initiative } from '@/types/initiative';
import { Calendar, User, Target, CheckCircle, ArrowRight, Eye, Clock, Star, MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface KanbanCardProps {
  initiative: Initiative;
  onStatusChange?: (initiativeId: string, newStatus: string) => void;
  onViewDetails?: (initiativeId: string) => void;
}

export default function KanbanCard({ initiative, onStatusChange, onViewDetails }: KanbanCardProps) {
  const router = useRouter();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: initiative.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'mandates': return 'bg-red-500';
      case 'performance': return 'bg-yellow-500';
      case 'value-prop': return 'bg-green-500';
      case 'new-product': return 'bg-blue-500';
      default: return 'bg-gray-500';
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

  const getPriorityColor = (score: number) => {
    if (score >= 90) return 'text-red-500';
    if (score >= 80) return 'text-orange-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-gray-500';
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
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-grab group ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Category indicator bar */}
      <div className={`h-1 rounded-t-lg ${getCategoryColor(initiative.category)}`} />
      
      <div className="p-3">
        {/* Header with title and country */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1 pr-2">
            {initiative.title}
          </h4>
          <span className="text-lg flex-shrink-0">
            {getCountryFlag(initiative.country)}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {initiative.summary}
        </p>

        {/* Tags and metadata */}
        <div className="flex flex-wrap gap-1 mb-3">
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md">
            {initiative.product}
          </span>
          {initiative.quarter && (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-md">
              {initiative.quarter}
            </span>
          )}
        </div>

        {/* Footer with score and metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {initiative.score && (
              <div className="flex items-center">
                <Star size={12} className={`mr-1 ${getPriorityColor(initiative.score)}`} />
                <span className={`text-xs font-semibold ${getPriorityColor(initiative.score)}`}>
                  {initiative.score}
                </span>
              </div>
            )}
            <div className="flex items-center text-xs text-gray-500">
              <Clock size={10} className="mr-1" />
              <span>{new Date(initiative.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails?.(initiative.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
          >
            <MoreHorizontal size={14} className="text-gray-400" />
          </button>
        </div>

        {/* Action Buttons - Only show on hover */}
        {availableActions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
            {availableActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.action();
                  }}
                  className={`w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded-md transition-colors ${action.color} mb-2 last:mb-0`}
                >
                  <IconComponent size={12} className="mr-2" />
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}