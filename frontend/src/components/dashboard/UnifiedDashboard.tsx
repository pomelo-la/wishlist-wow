'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Upload,
  Search,
  CheckCircle,
  Star,
  BarChart3,
  PieChart,
  Calendar,
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Users,
  Globe,
  Activity,
  Award,
  AlertTriangle,
  Zap,
  Building2,
  MapPin
} from 'lucide-react';

// Import both old and new components
import MetricCard from '@/components/ui/MetricCard';
import AnimatedMetricCard from '@/components/ui/AnimatedMetricCard';
import AnimatedChart from '@/components/ui/AnimatedChart';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiService, Initiative as ApiInitiative } from '@/services/api';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function UnifiedDashboard() {
  const [selectedFilters, setSelectedFilters] = useState({
    product: '',
    country: '',
    status: '',
    minScore: 1,
    minROI: 0
  });

  const [initiatives, setInitiatives] = useState<ApiInitiative[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    total_initiatives: 0,
    draft_initiatives: 0,
    in_review_initiatives: 0,
    prioritized_initiatives: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [initiativesResponse, statsResponse] = await Promise.all([
          apiService.getInitiatives({ limit: 100 }),
          apiService.getDashboardStats()
        ]);

        setInitiatives(initiativesResponse.data);
        setDashboardStats(statsResponse);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Error loading dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate metrics from API data
  const metrics = {
    total: dashboardStats.total_initiatives,
    loaded: initiatives.filter(i => i.status === 'loaded').length,
    businessReview: initiatives.filter(i => i.status === 'business-review').length,
    productReview: initiatives.filter(i => i.status === 'product-review').length,
    closure: initiatives.filter(i => i.status === 'closure').length,
    prioritized: dashboardStats.prioritized_initiatives
  };

  // Enhanced donut chart data with more realistic numbers
  const categoryData = {
    labels: ['Mandatos / Regulatorio', 'Mejora Performance', 'Value Prop', 'Nuevo Producto'],
    datasets: [
      {
        data: [35, 28, 22, 15],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
      },
    ],
  };

  const statusDistributionData = {
    labels: ['Backlog', 'En Revisión', 'Estimación', 'Priorizada', 'Completada'],
    datasets: [
      {
        data: [42, 28, 18, 15, 12],
        backgroundColor: ['#6b7280', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'],
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff',
      },
    ],
  };

  const quarterData = {
    labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
    datasets: [
      {
        label: 'Iniciativas',
        data: [45, 38, 42, 31],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  };

  // Enhanced performance data for overview charts
  const performanceData = [
    { name: 'Ene', value: 12, completed: 8 },
    { name: 'Feb', value: 15, completed: 11 },
    { name: 'Mar', value: 18, completed: 14 },
    { name: 'Abr', value: 22, completed: 19 },
    { name: 'May', value: 25, completed: 20 },
    { name: 'Jun', value: 28, completed: 25 }
  ];

  const countryData = [
    { name: 'Brasil', value: 42 },
    { name: 'México', value: 38 },
    { name: 'Argentina', value: 28 },
    { name: 'Chile', value: 22 },
    { name: 'Colombia', value: 18 },
    { name: 'ROLA', value: 8 }
  ];

  const filteredInitiatives = initiatives.filter(initiative => {
    return (
      (!selectedFilters.product || initiative.vertical === selectedFilters.product) &&
      (!selectedFilters.country || initiative.country === selectedFilters.country) &&
      (!selectedFilters.status || initiative.status === selectedFilters.status) &&
      (!initiative.score || initiative.score >= selectedFilters.minScore) &&
      (!initiative.roi || initiative.roi >= selectedFilters.minROI)
    );
  });

  const handleFilterChange = (filterType: string, value: string | number) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading) {
    return (
      <div className="h-64">
        <LoadingSpinner
          size="lg"
          text="Cargando dashboard unificado..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Top Animated Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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

      {/* Traditional Metrics Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Cargadas"
          value={metrics.loaded}
          icon={Upload}
          color="bg-yellow-500"
        />
        <MetricCard
          title="En Revisión"
          value={metrics.businessReview + metrics.productReview}
          icon={Search}
          color="bg-orange-500"
        />
        <MetricCard
          title="Cerradas"
          value={metrics.closure}
          icon={CheckCircle}
          color="bg-green-500"
        />
        <MetricCard
          title="Priorizadas"
          value={metrics.prioritized}
          icon={Star}
          color="bg-purple-500"
        />
        <MetricCard
          title="Países Activos"
          value={6}
          icon={Globe}
          color="bg-cyan-500"
        />
      </div>

      {/* Charts Section with Donut Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Distribution Donut */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart size={20} className="mr-2" />
            Distribución por Categoría
          </h3>
          <div className="h-64">
            <Doughnut
              data={categoryData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                      }
                    }
                  }
                },
              }}
            />
          </div>
        </motion.div>

        {/* Status Distribution Donut */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity size={20} className="mr-2" />
            Estados de Iniciativas
          </h3>
          <div className="h-64">
            <Doughnut
              data={statusDistributionData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                      }
                    }
                  }
                },
              }}
            />
          </div>
        </motion.div>

        {/* Quarter Performance Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 size={20} className="mr-2" />
            Iniciativas por Quarter
          </h3>
          <div className="h-64">
            <Bar
              data={quarterData}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 10,
                    },
                  },
                },
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Additional Charts from Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatedChart
          type="area"
          data={performanceData}
          title="📈 Rendimiento Mensual"
          color="#3b82f6"
          delay={0.8}
          height={300}
        />

        <AnimatedChart
          type="bar"
          data={countryData}
          title="🌎 Iniciativas por País"
          color="#10b981"
          delay={0.9}
          height={300}
        />
      </div>

      {/* Enhanced Filters and Initiative List */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar size={20} className="mr-2" />
            Gestión de Iniciativas ({filteredInitiatives.length})
          </h3>

          {/* Enhanced Filters with Score and ROI Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <select
              value={selectedFilters.product}
              onChange={(e) => handleFilterChange('product', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los productos</option>
              <option value="processing">Processing</option>
              <option value="core">Core</option>
              <option value="bin-sponsor">BIN Sponsor</option>
              <option value="card-mgmt">Card Management</option>
              <option value="tokenization">Tokenización</option>
              <option value="fraud">Fraud Tools</option>
              <option value="platform">Platform Experience</option>
            </select>

            <select
              value={selectedFilters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los países</option>
              <option value="AR">Argentina</option>
              <option value="BR">Brasil</option>
              <option value="MX">México</option>
              <option value="CL">Chile</option>
              <option value="CO">Colombia</option>
              <option value="ROLA">ROLA</option>
              <option value="cross-country">Cross-country</option>
            </select>

            <select
              value={selectedFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="loaded">Cargada</option>
              <option value="business-review">Revisión Negocio</option>
              <option value="product-review">Revisión Producto</option>
              <option value="closure">Cierre</option>
              <option value="prioritized">Priorizada</option>
            </select>

            {/* Score Slider */}
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="100"
                value={selectedFilters.minScore}
                onChange={(e) => handleFilterChange('minScore', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
              />
              <span className="text-sm text-gray-600 min-w-fit font-medium">
                Score: {selectedFilters.minScore}+
              </span>
            </div>

            {/* ROI Slider */}
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={selectedFilters.minROI}
                onChange={(e) => handleFilterChange('minROI', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
              />
              <span className="text-sm text-gray-600 min-w-fit font-medium">
                ROI: {selectedFilters.minROI}%+
              </span>
            </div>

            {/* Reset Filters Button */}
            <button
              onClick={() => setSelectedFilters({
                product: '',
                country: '',
                status: '',
                minScore: 1,
                minROI: 0
              })}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Reset Filtros
            </button>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Iniciativa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quarter
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInitiatives.map((initiative) => (
                <motion.tr
                  key={initiative.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {initiative.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {initiative.description?.substring(0, 60)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="capitalize">{initiative.vertical?.replace('-', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {initiative.country}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      initiative.status === 'prioritized'
                        ? 'bg-green-100 text-green-800'
                        : initiative.status === 'loaded'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {initiative.status?.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {initiative.category?.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-semibold px-2 py-1 rounded ${
                      (initiative.score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                      (initiative.score || 0) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {initiative.score || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-semibold px-2 py-1 rounded ${
                      (initiative.roi || 0) >= 200 ? 'bg-green-100 text-green-800' :
                      (initiative.roi || 0) >= 100 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {initiative.roi ? `${initiative.roi}%` : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {initiative.quarter || 'TBD'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-center py-4 text-sm text-gray-500"
      >
        Mostrando {filteredInitiatives.length} de {initiatives.length} iniciativas •
        Última actualización: {new Date().toLocaleString('es-ES')}
      </motion.div>
    </div>
  );
}