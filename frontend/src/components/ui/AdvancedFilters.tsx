'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  Filter,
  Calendar,
  Globe,
  Building2,
  Target,
  X,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdvancedFiltersProps {
  filters: {
    quarter: string;
    countries: string[];
    categories: string[];
    verticals: string[];
    riskLevels: string[];
    dateRange: { start: string; end: string };
  };
  onFiltersChange: (filters: any) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const quarterOptions: FilterOption[] = [
  { value: 'all', label: 'Todos los quarters', count: 156 },
  { value: 'Q1-2024', label: 'Q1 2024', count: 45 },
  { value: 'Q2-2024', label: 'Q2 2024', count: 38 },
  { value: 'Q3-2024', label: 'Q3 2024', count: 42 },
  { value: 'Q4-2024', label: 'Q4 2024', count: 31 }
];

const countryOptions: FilterOption[] = [
  { value: 'Brasil', label: '🇧🇷 Brasil', count: 42 },
  { value: 'Mexico', label: '🇲🇽 México', count: 38 },
  { value: 'Argentina', label: '🇦🇷 Argentina', count: 28 },
  { value: 'Chile', label: '🇨🇱 Chile', count: 22 },
  { value: 'Colombia', label: '🇨🇴 Colombia', count: 18 },
  { value: 'ROLA', label: '🌎 ROLA', count: 8 }
];

const categoryOptions: FilterOption[] = [
  { value: 'regulatory', label: 'Mandates / Regulatorio', count: 35 },
  { value: 'performance', label: 'Mejora de performance', count: 28 },
  { value: 'value-prop', label: 'Value Prop', count: 22 },
  { value: 'new-product', label: 'Nuevo producto', count: 15 }
];

const verticalOptions: FilterOption[] = [
  { value: 'processing', label: 'Processing', count: 32 },
  { value: 'core', label: 'Core', count: 28 },
  { value: 'fraud-tools', label: 'Fraud Tools', count: 18 },
  { value: 'tokenization', label: 'Tokenización', count: 16 },
  { value: 'platform', label: 'Platform Experience', count: 12 }
];

const riskLevelOptions: FilterOption[] = [
  { value: 'low', label: 'Bajo', count: 45 },
  { value: 'medium', label: 'Medio', count: 32 },
  { value: 'high', label: 'Alto', count: 18 },
  { value: 'blocker', label: 'Bloqueante', count: 5 }
];

export default function AdvancedFilters({
  filters,
  onFiltersChange,
  isExpanded,
  onToggleExpanded
}: AdvancedFiltersProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleFilterChange = (filterType: string, value: string, isMultiple = false) => {
    if (isMultiple) {
      const currentValues = filters[filterType as keyof typeof filters] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      onFiltersChange({ ...filters, [filterType]: newValues });
    } else {
      onFiltersChange({ ...filters, [filterType]: value });
    }
  };

  const resetFilters = () => {
    onFiltersChange({
      quarter: 'all',
      countries: [],
      categories: [],
      verticals: [],
      riskLevels: [],
      dateRange: { start: '', end: '' }
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.quarter !== 'all') count++;
    count += filters.countries.length;
    count += filters.categories.length;
    count += filters.verticals.length;
    count += filters.riskLevels.length;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  };

  const FilterDropdown = ({
    title,
    icon: Icon,
    options,
    filterKey,
    isMultiple = false
  }: {
    title: string;
    icon: any;
    options: FilterOption[];
    filterKey: string;
    isMultiple?: boolean;
  }) => {
    const isOpen = activeDropdown === filterKey;
    const activeValues = isMultiple
      ? filters[filterKey as keyof typeof filters] as string[]
      : [filters[filterKey as keyof typeof filters] as string];

    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveDropdown(isOpen ? null : filterKey)}
          className={`flex items-center px-4 py-2 bg-white border rounded-lg text-sm font-medium transition-all duration-200 ${
            activeValues.length > 0 && activeValues[0] !== 'all'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          <Icon size={16} className="mr-2" />
          {title}
          {activeValues.length > 0 && activeValues[0] !== 'all' && (
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
              {isMultiple ? activeValues.length : '1'}
            </span>
          )}
          <ChevronDown
            size={16}
            className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              {options.map((option) => (
                <motion.button
                  key={option.value}
                  whileHover={{ backgroundColor: '#f8fafc' }}
                  onClick={() => {
                    handleFilterChange(filterKey, option.value, isMultiple);
                    if (!isMultiple) setActiveDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                    activeValues.includes(option.value)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {option.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter size={20} className="mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros Avanzados</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="ml-3 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {getActiveFiltersCount()} activos
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetFilters}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <RefreshCw size={16} className="mr-1" />
            Reset
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleExpanded}
            className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            {isExpanded ? 'Contraer' : 'Expandir'}
            <ChevronDown
              size={16}
              className={`ml-1 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </motion.button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <FilterDropdown
          title="Quarter"
          icon={Calendar}
          options={quarterOptions}
          filterKey="quarter"
        />

        <FilterDropdown
          title="Países"
          icon={Globe}
          options={countryOptions}
          filterKey="countries"
          isMultiple
        />

        <FilterDropdown
          title="Categorías"
          icon={Target}
          options={categoryOptions}
          filterKey="categories"
          isMultiple
        />

        <FilterDropdown
          title="Verticales"
          icon={Building2}
          options={verticalOptions}
          filterKey="verticals"
          isMultiple
        />

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap gap-3"
          >
            <FilterDropdown
              title="Nivel de Riesgo"
              icon={Filter}
              options={riskLevelOptions}
              filterKey="riskLevels"
              isMultiple
            />

            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">hasta</span>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </motion.div>
  );
}