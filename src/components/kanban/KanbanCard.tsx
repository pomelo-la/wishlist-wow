'use client';

import { Initiative } from '@/types/initiative';
import { Calendar, User, Target } from 'lucide-react';

interface KanbanCardProps {
  initiative: Initiative;
}

export default function KanbanCard({ initiative }: KanbanCardProps) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
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
              initiative.effortEstimate === 'S' ? 'bg-green-100 text-green-800' :
              initiative.effortEstimate === 'M' ? 'bg-yellow-100 text-yellow-800' :
              initiative.effortEstimate === 'L' ? 'bg-orange-100 text-orange-800' :
              'bg-red-100 text-red-800'
            }`}>
              {initiative.effortEstimate}
            </span>
          </div>
          {initiative.confidence && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">Confianza:</span>
              <span className="text-xs font-medium">
                {initiative.confidence}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}