'use client';

import { useState } from 'react';
import { 
  ClipboardList, 
  Upload, 
  Search, 
  CheckCircle, 
  Star,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';
import MetricCard from '@/components/ui/MetricCard';
import { getInitiativesMetrics, mockInitiatives } from '@/data/mockData';
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

export default function Dashboard() {
  const [selectedFilters, setSelectedFilters] = useState({
    product: '',
    country: '',
    status: '',
    minScore: 1
  });

  const metrics = getInitiativesMetrics();

  const categoryData = {
    labels: ['Mandatos', 'Performance', 'Value Prop', 'Nuevo Producto'],
    datasets: [
      {
        data: [1, 2, 1, 1],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
        borderWidth: 0,
      },
    ],
  };

  const quarterData = {
    labels: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'],
    datasets: [
      {
        label: 'Iniciativas',
        data: [3, 2, 0, 0],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
      },
    ],
  };

  const filteredInitiatives = mockInitiatives.filter(initiative => {
    return (
      (!selectedFilters.product || initiative.vertical === selectedFilters.product) &&
      (!selectedFilters.country || initiative.country === selectedFilters.country) &&
      (!selectedFilters.status || initiative.status === selectedFilters.status) &&
      (!initiative.score || initiative.score >= selectedFilters.minScore)
    );
  });

  const handleFilterChange = (filterType: string, value: string | number) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Iniciativas"
          value={metrics.total}
          icon={ClipboardList}
          color="bg-blue-500"
        />
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
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                        return `${context.label}: ${percentage}%`;
                      }
                    }
                  }
                },
              }} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
                      stepSize: 1,
                    },
                  },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Filters and Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar size={20} className="mr-2" />
            Todas las Iniciativas
          </h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="100"
                value={selectedFilters.minScore}
                onChange={(e) => handleFilterChange('minScore', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 min-w-fit">
                Score: {selectedFilters.minScore}+
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
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
                  Quarter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInitiatives.map((initiative) => (
                <tr key={initiative.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {initiative.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {initiative.summary.substring(0, 60)}...
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="capitalize">{initiative.vertical.replace('-', ' ')}</span>
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
                      {initiative.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {initiative.category.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {initiative.quarter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="font-semibold">{initiative.score}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}