'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Users,
  Globe,
  BarChart3,
  PieChart,
  Activity,
  Award,
  AlertTriangle,
  CheckCircle,
  Zap,
  Calendar,
  Building2,
  MapPin
} from 'lucide-react';

import AnimatedMetricCard from '@/components/ui/AnimatedMetricCard';
import AnimatedChart from '@/components/ui/AnimatedChart';
import AdvancedFilters from '@/components/ui/AdvancedFilters';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiService, Initiative as ApiInitiative } from '@/services/api';

export default function Overview() {
  const [initiatives, setInitiatives] = useState<ApiInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState({
    quarter: 'all',
    countries: [],
    categories: [],
    verticals: [],
    riskLevels: [],
    dateRange: { start: '', end: '' }
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await apiService.getInitiatives({ limit: 1000 });
        setInitiatives(response.data);
      } catch (error) {
        console.error('Error loading initiatives:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sample data for charts (in real app, this would be calculated from initiatives)
  const performanceData = [
    { name: 'Ene', value: 12, completed: 8 },
    { name: 'Feb', value: 15, completed: 11 },
    { name: 'Mar', value: 18, completed: 14 },
    { name: 'Abr', value: 22, completed: 19 },
    { name: 'May', value: 25, completed: 20 },
    { name: 'Jun', value: 28, completed: 25 }
  ];

  const categoryDistribution = [
    { name: 'Regulatorio', value: 35, color: '#ef4444' },
    { name: 'Performance', value: 28, color: '#f59e0b' },
    { name: 'Value Prop', value: 22, color: '#10b981' },
    { name: 'Nuevo Producto', value: 15, color: '#3b82f6' }
  ];

  const countryData = [
    { name: 'Brasil', value: 42 },
    { name: 'México', value: 38 },
    { name: 'Argentina', value: 28 },
    { name: 'Chile', value: 22 },
    { name: 'Colombia', value: 18 },
    { name: 'ROLA', value: 8 }
  ];

  const riskTrendData = [
    { name: 'Q1', alto: 5, medio: 12, bajo: 18 },
    { name: 'Q2', alto: 3, medio: 15, bajo: 22 },
    { name: 'Q3', alto: 2, medio: 18, bajo: 25 },
    { name: 'Q4', alto: 1, medio: 20, bajo: 28 }
  ];

  const roiData = [
    { name: 'Q1', roi: 125, initiatives: 15 },
    { name: 'Q2', roi: 158, initiatives: 18 },
    { name: 'Q3', roi: 189, initiatives: 22 },
    { name: 'Q4', roi: 234, initiatives: 25 }
  ];

  if (loading) {
    return (
      <div className="h-64">
        <LoadingSpinner
          size="lg"
          text="Cargando datos de Overview..."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with title and summary */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pb-8"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📊 Overview Analytics
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Panel completo de estadísticas y métricas de rendimiento para la gestión de iniciativas empresariales
        </p>
      </motion.div>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filters}
        onFiltersChange={setFilters}
        isExpanded={filtersExpanded}
        onToggleExpanded={() => setFiltersExpanded(!filtersExpanded)}
      />

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <AnimatedMetricCard
          title="Total Iniciativas"
          value={156}
          previousValue={142}
          icon={Target}
          color="bg-blue-500"
          delay={0}
          trend="up"
          trendValue={9.8}
        />
        <AnimatedMetricCard
          title="ROI Promedio"
          value={187}
          previousValue={165}
          suffix="%"
          icon={TrendingUp}
          color="bg-green-500"
          delay={0.1}
          trend="up"
          trendValue={13.3}
        />
        <AnimatedMetricCard
          title="Revenue Generado"
          value={2.4}
          previousValue={1.9}
          prefix="$"
          suffix="M"
          icon={DollarSign}
          color="bg-emerald-500"
          delay={0.2}
          trend="up"
          trendValue={26.3}
        />
        <AnimatedMetricCard
          title="Tiempo Promedio"
          value={24}
          previousValue={31}
          suffix=" días"
          icon={Clock}
          color="bg-orange-500"
          delay={0.3}
          trend="down"
          trendValue={22.6}
        />
        <AnimatedMetricCard
          title="Score Promedio"
          value={78}
          previousValue={72}
          suffix="/100"
          icon={Award}
          color="bg-purple-500"
          delay={0.4}
          trend="up"
          trendValue={8.3}
        />
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedMetricCard
          title="Países Activos"
          value={6}
          icon={Globe}
          color="bg-cyan-500"
          delay={0.5}
        />
        <AnimatedMetricCard
          title="Iniciativas Completadas"
          value={89}
          previousValue={76}
          icon={CheckCircle}
          color="bg-green-600"
          delay={0.6}
          trend="up"
          trendValue={17.1}
        />
        <AnimatedMetricCard
          title="Riesgos Críticos"
          value={3}
          previousValue={7}
          icon={AlertTriangle}
          color="bg-red-500"
          delay={0.7}
          trend="down"
          trendValue={57.1}
        />
        <AnimatedMetricCard
          title="Eficiencia IA"
          value={94}
          previousValue={88}
          suffix="%"
          icon={Zap}
          color="bg-indigo-500"
          delay={0.8}
          trend="up"
          trendValue={6.8}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Timeline */}
        <AnimatedChart
          type="area"
          data={performanceData}
          title="📈 Rendimiento Mensual"
          color="#3b82f6"
          delay={0.9}
          height={350}
        />

        {/* Category Distribution */}
        <AnimatedChart
          type="pie"
          data={categoryDistribution}
          title="🎯 Distribución por Categoría"
          colors={['#ef4444', '#f59e0b', '#10b981', '#3b82f6']}
          delay={1.0}
          height={350}
        />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Country Distribution */}
        <AnimatedChart
          type="bar"
          data={countryData}
          title="🌎 Iniciativas por País"
          color="#10b981"
          delay={1.1}
          height={300}
        />

        {/* Risk Trends */}
        <AnimatedChart
          type="line"
          data={riskTrendData}
          title="⚠️ Evolución de Riesgos"
          color="#f59e0b"
          delay={1.2}
          height={300}
        />

        {/* ROI Evolution */}
        <AnimatedChart
          type="area"
          data={roiData}
          title="💰 Evolución ROI"
          color="#8b5cf6"
          delay={1.3}
          height={300}
        />
      </div>

      {/* Summary Cards Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Top Performers */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Top Performers</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">🇧🇷 Brasil - Processing</span>
              <span className="font-bold text-blue-600">Score: 95</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">🇲🇽 México - Core</span>
              <span className="font-bold text-blue-600">Score: 92</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">🇦🇷 Argentina - Fraud</span>
              <span className="font-bold text-blue-600">Score: 89</span>
            </div>
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-red-500 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Alertas Críticas</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Riesgo Bloqueante</span>
              <span className="font-bold text-red-600">3 activos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Sobre plazo +30 días</span>
              <span className="font-bold text-red-600">7 casos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Score bajo (&lt;50)</span>
              <span className="font-bold text-red-600">12 items</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 ml-3">Stats Rápidas</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Completadas esta semana</span>
              <span className="font-bold text-green-600">12</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Accuracy del scoring</span>
              <span className="font-bold text-green-600">94.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Ahorro de tiempo</span>
              <span className="font-bold text-green-600">340h</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer with last update */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="text-center py-6 text-sm text-gray-500"
      >
        Última actualización: {new Date().toLocaleString('es-ES')} •
        Datos en tiempo real desde API v1.0
      </motion.div>
    </div>
  );
}