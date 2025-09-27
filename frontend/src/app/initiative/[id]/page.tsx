'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Initiative } from '@/types/initiative';
import { apiService, Initiative as ApiInitiative } from '@/services/api';
import Header from '@/components/layout/Header';
import InitiativeActivityLog from '@/components/activity/InitiativeActivityLog';
import { 
  ArrowLeft, 
  MessageSquare, 
  Settings, 
  Clock, 
  User, 
  Calendar,
  Target,
  Send,
  Save,
  CheckCircle,
  Eye,
  Activity,
  Zap,
  AlertCircle,
  BarChart2,
  FileText,
  Percent,
  ChevronRight,
  Plus,
  X
} from 'lucide-react';

interface ReviewMessage {
  id: string;
  author: string;
  role: 'business' | 'product' | 'tech' | 'ux';
  content: string;
  tags: string[];
  timestamp: Date;
}

export default function InitiativeEvaluationPage() {
  const router = useRouter();
  const params = useParams();
  const [initiative, setInitiative] = useState<Initiative | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviewMessages, setReviewMessages] = useState<ReviewMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [structuredFields, setStructuredFields] = useState({
    effortDays: 0,
    confidence: 0,
    quarter: '',
    notes: '',
    unreachedCases: ''
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [initiativeData, setInitiativeData] = useState({
    category: 'Mandates / Regulatorio / Riesgo',
    vertical: 'Processing',
    clientType: 'Todos',
    country: 'Brasil',
    systemicRisk: 'Alto',
    economicImpact: 'Aumento significativo en revenue o nueva linea revenue',
    economicImpactDescription: 'Esta iniciativa generará un nuevo flujo de ingresos estimado en $2M anuales a través de la implementación de nuevas funcionalidades regulatorias.',
    experienceImpact: ['Contact Rate', 'Aprobación', 'SLA de incidencias'],
    competitiveApproach: 'Disrrustivo / Innovador',
    executiveSummary: 'Esta iniciativa busca implementar nuevas funcionalidades regulatorias que nos permitirán cumplir con las normativas brasileñas más recientes, generando un nuevo flujo de ingresos significativo mientras mejoramos la experiencia del cliente.',
    roi: 340
  });

  const [prodItData, setProdItData] = useState({
    // Tecnología
    techSeeds: 15,
    techCertainty: 75,
    techNotes: 'Implementación de nuevas APIs para integración con sistemas regulatorios brasileños. Se requiere migración de datos existentes y validación de compatibilidad.',
    
    // UX
    uxSeeds: 8,
    uxCertainty: 85,
    uxCases: 'Rediseño de formularios de onboarding para cumplir con normativas KYC. Implementación de flujos de verificación adicionales para usuarios brasileños.',
    
    // Producto
    productCases: 'Nuevas funcionalidades de reporte automático para autoridades regulatorias. Dashboard de monitoreo en tiempo real de transacciones.',
    productProviders: 'Integración con ProveedorRegulatorioBR, ConsultoraCompliance, y ServiciosKYC. Contratos ya firmados con 2 de 3 proveedores.',
    productNotConsidered: 'No se contempla integración con sistemas legacy de bancos pequeños. Solo se soportará la normativa vigente, no futuras actualizaciones.',
    productCertainty: 70
  });

  // Estados para dependencias
  const [dependencies, setDependencies] = useState<Array<{
    id: string;
    area: string;
    description: string;
    sent?: boolean;
  }>>([]);
  const [currentAreaSearch, setCurrentAreaSearch] = useState('');
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);
  const [currentDependencyId, setCurrentDependencyId] = useState<string | null>(null);

  // Lista de áreas disponibles
  const availableAreas = [
    'Cards Hub', 'Payment Processor', 'Risk', 'Lending', 'Accounts', 'Experience', 
    'Dashboard', 'Frontend', 'Data', 'Infra & Security', 'TechOps', 'Platform', 
    'Development', 'Developer Experience', 'Artificial Intelligence', 'Product', 
    'Operations', 'Customer Success', 'Finance', 'Legal', 'Marketing', 'People', 
    'Printing & Logistics', 'Customer Support', 'Commercial'
  ];

  // Load initiative data from API
  useEffect(() => {
    const loadInitiative = async () => {
      if (!params.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await apiService.getInitiative(params.id as string);
        const apiInitiative = response.data;
        
        // Map API initiative to frontend format
        const mappedInitiative: Initiative = {
          id: apiInitiative.id,
          title: apiInitiative.title,
          description: apiInitiative.description,
          status: apiInitiative.status,
          createdBy: apiInitiative.created_by,
          createdAt: new Date(apiInitiative.created_at),
          updatedAt: new Date(apiInitiative.updated_at),
          quarter: apiInitiative.quarter,
          score: apiInitiative.score,
          category: apiInitiative.category,
          vertical: apiInitiative.vertical,
          clientType: apiInitiative.client_type,
          country: apiInitiative.country,
          systemicRisk: apiInitiative.systemic_risk,
          economicImpact: apiInitiative.economic_impact,
          economicImpactDescription: apiInitiative.economic_impact_description,
          experienceImpact: apiInitiative.experience_impact,
          competitiveApproach: apiInitiative.competitive_approach,
          executiveSummary: apiInitiative.executive_summary,
          roi: apiInitiative.roi,
          // Map additional fields for compatibility
          product: apiInitiative.vertical,
          summary: apiInitiative.description,
        };
        
        setInitiative(mappedInitiative);
        
        // Load messages from API
        try {
          const messages = await apiService.getInitiativeMessages(params.id as string);
          setReviewMessages(messages.map((msg: any) => ({
            id: msg.id,
            author: msg.author || 'Sistema',
            role: msg.role || 'business',
            content: msg.content,
            tags: msg.tags || [],
            timestamp: new Date(msg.timestamp || msg.created_at)
          })));
        } catch (msgError) {
          console.warn('Could not load messages:', msgError);
          // Set empty messages if API fails
          setReviewMessages([]);
        }
        
      } catch (err) {
        console.error('Error loading initiative:', err);
        setError(err instanceof Error ? err.message : 'Error loading initiative');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitiative();
  }, [params.id]);

  // Cargar mensajes de revisión simulados (fallback)
  if (!initiative && !isLoading && !error) {
    setReviewMessages([
      {
        id: '1',
        author: 'Ana Silva',
        role: 'business',
        content: 'Esta iniciativa es crítica para el cumplimiento regulatorio en Brasil. Necesitamos priorizarla para Q1.',
        tags: ['urgent', 'compliance'],
        timestamp: new Date('2024-01-15T10:30:00')
      },
      {
        id: '2',
        author: 'Carlos Mendoza',
        role: 'tech',
        content: 'La implementación técnica es compleja pero factible. Estimamos 3-4 sprints de desarrollo.',
        tags: ['technical', 'estimation'],
        timestamp: new Date('2024-01-15T14:20:00')
      }
    ]);
  }


  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: ReviewMessage = {
      id: Date.now().toString(),
      author: 'Admin',
      role: 'business',
      content: currentMessage,
      tags: selectedTags,
      timestamp: new Date()
    };

    setReviewMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    setSelectedTags([]);
  };


  const handleSaveDraft = () => {
    console.log('Saving draft...', structuredFields);
  };

  const handleCloseEvaluation = () => {
    const isConfirmed = window.confirm(
      'Estas moviendo de estado esta iniciativa, estas seguro que tiene todo lo necesario?'
    );
    
    if (isConfirmed) {
      console.log('Closing evaluation...', structuredFields);
      router.push('/?tab=kanban');
    }
  };

  // Funciones para manejar dependencias
  const filteredAreas = availableAreas.filter(area =>
    area.toLowerCase().includes(currentAreaSearch.toLowerCase())
  );

  const handleAreaSearchChange = (value: string) => {
    setCurrentAreaSearch(value);
    setShowAreaDropdown(value.length > 0);
  };

  const handleAreaSelect = (area: string, dependencyId: string) => {
    setDependencies(prev => prev.map(dep => 
      dep.id === dependencyId ? { ...dep, area } : dep
    ));
    setCurrentAreaSearch('');
    setShowAreaDropdown(false);
    setCurrentDependencyId(null);
  };

  const handleDescriptionChange = (dependencyId: string, description: string) => {
    setDependencies(prev => prev.map(dep => 
      dep.id === dependencyId ? { ...dep, description } : dep
    ));
  };

  const addNewDependency = () => {
    const newId = Date.now().toString();
    setDependencies(prev => [...prev, {
      id: newId,
      area: '',
      description: ''
    }]);
    setCurrentDependencyId(newId);
    setCurrentAreaSearch('');
    setShowAreaDropdown(true);
  };

  const removeDependency = (dependencyId: string) => {
    setDependencies(prev => prev.filter(dep => dep.id !== dependencyId));
  };

  const sendDependency = (dependencyId: string) => {
    const dependency = dependencies.find(dep => dep.id === dependencyId);
    if (dependency && dependency.area && dependency.description) {
      console.log('Enviando dependencia:', dependency);
      // Aquí se enviaría la dependencia al backend
      alert(`Dependencia enviada: ${dependency.area} - ${dependency.description}`);
      
      // Marcar como enviada (agregar flag)
      setDependencies(prev => prev.map(dep => 
        dep.id === dependencyId ? { ...dep, sent: true } : dep
      ));
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      business: 'bg-emerald-500',
      product: 'bg-blue-500',
      tech: 'bg-purple-500',
      ux: 'bg-pink-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

  // Funciones para mostrar datos de manera creativa
  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'Argentina': '🇦🇷',
      'Brasil': '🇧🇷',
      'Chile': '🇨🇱',
      'Colombia': '🇨🇴',
      'Mexico': '🇲🇽',
      'ROLA': '🌎',
      'Todos': '🌍'
    };
    return flags[country] || '🌍';
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Mandates / Regulatorio / Riesgo': '⚖️',
      'Mejora de performance': '⚡',
      'Value Prop': '💎',
      'Lanzamiento nuevo producto': '🚀'
    };
    return icons[category] || '📋';
  };

  const getVerticalIcon = (vertical: string) => {
    const icons: { [key: string]: string } = {
      'Processing': '⚙️',
      'Core': '🔧',
      'BIN Sponsor': '🏦',
      'Card Management & Logistics': '💳',
      'Tokenización': '🔐',
      'Fraud Tools': '🛡️',
      'Platform experience': '🎯'
    };
    return icons[vertical] || '📊';
  };

  const getRiskColor = (risk: string) => {
    const colors: { [key: string]: string } = {
      'Bloqueante': 'bg-red-100 text-red-800 border-red-200',
      'Alto': 'bg-orange-100 text-orange-800 border-orange-200',
      'Medio': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Bajo': 'bg-green-100 text-green-800 border-green-200',
      'N/A': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[risk] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getEconomicImpactColor = (impact: string) => {
    if (impact.includes('significativo')) return 'bg-green-100 text-green-800 border-green-200';
    if (impact.includes('moderado')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getCompetitiveApproachColor = (approach: string) => {
    if (approach.includes('Disrrustivo')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (approach.includes('incremental')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Funciones para áreas de Prod & IT
  const getAreaIcon = (area: string) => {
    const icons: { [key: string]: string } = {
      'Tecnología': '⚙️',
      'UX': '🎨',
      'Producto': '📦'
    };
    return icons[area] || '📋';
  };

  const getAreaColor = (area: string) => {
    const colors: { [key: string]: string } = {
      'Tecnología': 'bg-blue-50 border border-blue-200',
      'UX': 'bg-purple-50 border border-purple-200',
      'Producto': 'bg-green-50 border border-green-200'
    };
    return colors[area] || 'bg-gray-50 border border-gray-200';
  };

  const getCertaintyColor = (certainty: number) => {
    if (certainty >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (certainty >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (certainty >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando iniciativa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mr-4"
          >
            Reintentar
          </button>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!initiative) {
  return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Iniciativa no encontrada</h2>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        activeView="kanban" 
        onViewChange={(view) => {
          if (view === 'kanban') {
            router.push('/?tab=kanban');
          } else if (view === 'dashboard') {
            router.push('/?tab=dashboard');
          } else if (view === 'intake') {
            router.push('/?tab=intake');
          }
        }}
      />
      
      <main className="h-[calc(100vh-5rem)] flex bg-gray-50">
        {/* Main Chat Panel - 50% width */}
        <div className="w-1/2 flex flex-col px-6 py-8">
          {/* Initiative Header - Grid arriba del chat */}
          <div className="mb-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {initiative?.title || 'Cargando...'}
              </h1>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">{initiative?.createdBy || 'Juan Pérez'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">{initiative?.createdAt ? new Date(initiative.createdAt).toLocaleDateString('es-ES') : '14/1/2024'}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Target size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">{initiative?.quarter || 'Q2'}</span>
                  </div>
                
                <div className="flex items-center space-x-2">
                  <Zap size={16} className="text-gray-500" />
                  <span className="text-sm text-gray-600">Score: {initiative?.score || 85}</span>
                </div>
                  </div>
            </div>
          </div>

          {/* Chat Messages Area - Integrated style */}
          <div className="flex-1">
            <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {reviewMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>No hay mensajes aún. Inicia la conversación sobre esta iniciativa.</p>
                    </div>
                      </div>
                    ) : (
                      reviewMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'business' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-lg p-4 rounded-lg ${
                          message.role === 'business'
                            ? 'bg-blue-600 text-white'
                            : message.role === 'tech'
                            ? 'bg-purple-50 border border-purple-200 text-purple-900'
                            : message.role === 'product'
                            ? 'bg-blue-50 border border-blue-200 text-blue-900'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium ${getRoleColor(message.role)}`}>
                            {message.author.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{message.author}</span>
                          <span className={`text-xs ${
                            message.role === 'business' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {message.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {message.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                      {tag}
                                    </span>
                                  ))}
                  </div>
                )}
              </div>
                        </div>
                      ))
                    )}
            </div>

              {/* Chat Input - Integrated at bottom */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex space-x-4">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Escribí tu respuesta aquí..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      />
              <button 
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
                        <Send size={18} />
              </button>
                    </div>
                  </div>
                </div>
            </div>
          </div>

        {/* Sidebar with Initiative Details - 50% width */}
        <div className="w-1/2 flex flex-col px-6 py-8">
          {/* Gran Card que contiene todo el sidebar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
          

          {/* Tabs - Using Header style */}
          <div className="p-4">
            <nav className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Vista general', icon: Eye },
                { id: 'prod-it', label: 'Prod & IT', icon: Settings },
                { id: 'dependency', label: 'Dependencia', icon: FileText },
                { id: 'activity', label: 'Activity', icon: Activity }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                  <tab.icon size={14} className="mr-1" />
                {tab.label}
              </button>
            ))}
            </nav>
          </div>

          {/* Botones fijos debajo de las solapas */}
          <div className="px-4 pb-4">
            <div className="flex space-x-3">
              <button 
                onClick={handleSaveDraft}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save size={16} className="mr-2" />
                Guardar
              </button>
              <button 
                onClick={handleCloseEvaluation}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={16} className="mr-2" />
                Cerrar Evaluación
              </button>
          </div>
        </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Header con botón de edición */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Datos Generales</h3>
              <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isEditMode 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                  >
                    {isEditMode ? '✅ Guardar' : '✏️ Editar'}
              </button>
        </div>

                {/* Resumen Ejecutivo */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <BarChart2 size={20} className="mr-2 text-blue-600" />
                    Resumen Ejecutivo
                  </h4>
                  {isEditMode ? (
                    <textarea
                      value={initiativeData.executiveSummary}
                      onChange={(e) => setInitiativeData(prev => ({ ...prev, executiveSummary: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      rows={4}
                      placeholder="Resumen ejecutivo de la iniciativa..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{initiativeData.executiveSummary}</p>
                  )}
                    </div>
                    
                {/* ROI */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Percent size={20} className="mr-2 text-green-600" />
                      ROI Estimado
                    </h4>
                    <div className="text-right">
                      {isEditMode ? (
                        <input
                          type="number"
                          value={initiativeData.roi}
                          onChange={(e) => setInitiativeData(prev => ({ ...prev, roi: parseInt(e.target.value) || 0 }))}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right font-bold text-2xl"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-green-600">{initiativeData.roi}%</span>
                      )}
                  </div>
                </div>
              </div>

                {/* Grid de datos generales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Categoría */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="text-lg mr-2">{getCategoryIcon(initiativeData.category)}</span>
                      Categoría
                    </label>
                    {isEditMode ? (
                      <select
                        value={initiativeData.category}
                        onChange={(e) => setInitiativeData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Mandates / Regulatorio / Riesgo">⚖️ Mandates / Regulatorio / Riesgo</option>
                        <option value="Mejora de performance">⚡ Mejora de performance</option>
                        <option value="Value Prop">💎 Value Prop</option>
                        <option value="Lanzamiento nuevo producto">🚀 Lanzamiento nuevo producto</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getCategoryIcon(initiativeData.category)}</span>
                        <span className="text-gray-900 font-medium">{initiativeData.category}</span>
                      </div>
                    )}
                    </div>
                    
                  {/* Vertical */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="text-lg mr-2">{getVerticalIcon(initiativeData.vertical)}</span>
                      Vertical
                        </label>
                    {isEditMode ? (
                      <select
                        value={initiativeData.vertical}
                        onChange={(e) => setInitiativeData(prev => ({ ...prev, vertical: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Processing">⚙️ Processing</option>
                        <option value="Core">🔧 Core</option>
                        <option value="BIN Sponsor">🏦 BIN Sponsor</option>
                        <option value="Card Management & Logistics">💳 Card Management & Logistics</option>
                        <option value="Tokenización">🔐 Tokenización</option>
                        <option value="Fraud Tools">🛡️ Fraud Tools</option>
                        <option value="Platform experience">🎯 Platform experience</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getVerticalIcon(initiativeData.vertical)}</span>
                        <span className="text-gray-900 font-medium">{initiativeData.vertical}</span>
                      </div>
                    )}
                      </div>

                  {/* Tipo de Cliente */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <User size={20} className="inline mr-2" />
                      Tipo de Cliente
                      </label>
                    {isEditMode ? (
                      <select
                        value={initiativeData.clientType}
                        onChange={(e) => setInitiativeData(prev => ({ ...prev, clientType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Todos">👥 Todos</option>
                        <option value="Top Issuer">👑 Top Issuer</option>
                        <option value="Tier 1">🥇 Tier 1</option>
                        <option value="Tier 2">🥈 Tier 2</option>
                        <option value="Tier 3">🥉 Tier 3</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {initiativeData.clientType === 'Todos' ? '👥' : 
                           initiativeData.clientType === 'Top Issuer' ? '👑' :
                           initiativeData.clientType === 'Tier 1' ? '🥇' :
                           initiativeData.clientType === 'Tier 2' ? '🥈' : '🥉'}
                        </span>
                        <span className="text-gray-900 font-medium">{initiativeData.clientType}</span>
                      </div>
                    )}
                  </div>

                  {/* País */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="text-lg mr-2">{getCountryFlag(initiativeData.country)}</span>
                      País
                      </label>
                    {isEditMode ? (
                      <select
                        value={initiativeData.country}
                        onChange={(e) => setInitiativeData(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Todos">🌍 Todos</option>
                        <option value="Argentina">🇦🇷 Argentina</option>
                        <option value="Brasil">🇧🇷 Brasil</option>
                        <option value="Chile">🇨🇱 Chile</option>
                        <option value="Colombia">🇨🇴 Colombia</option>
                        <option value="Mexico">🇲🇽 Mexico</option>
                        <option value="ROLA">🌎 ROLA</option>
                      </select>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getCountryFlag(initiativeData.country)}</span>
                        <span className="text-gray-900 font-medium">{initiativeData.country}</span>
                </div>
                    )}
                      </div>

                  {/* Riesgo Sistémico */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <AlertCircle size={20} className="inline mr-2" />
                      Riesgo Sistémico
                      </label>
                    {isEditMode ? (
                      <select
                        value={initiativeData.systemicRisk}
                        onChange={(e) => setInitiativeData(prev => ({ ...prev, systemicRisk: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Bloqueante">🔴 Bloqueante</option>
                        <option value="Alto">🟠 Alto</option>
                        <option value="Medio">🟡 Medio</option>
                        <option value="Bajo">🟢 Bajo</option>
                        <option value="N/A">⚪ N/A</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(initiativeData.systemicRisk)}`}>
                        {initiativeData.systemicRisk === 'Bloqueante' ? '🔴' :
                         initiativeData.systemicRisk === 'Alto' ? '🟠' :
                         initiativeData.systemicRisk === 'Medio' ? '🟡' :
                         initiativeData.systemicRisk === 'Bajo' ? '🟢' : '⚪'} {initiativeData.systemicRisk}
                                </span>
                    )}
                              </div>

                  {/* Impacto Económico */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Target size={20} className="inline mr-2" />
                      Impacto Económico
                      </label>
                    {isEditMode ? (
                      <select
                        value={initiativeData.economicImpact}
                        onChange={(e) => setInitiativeData(prev => ({ ...prev, economicImpact: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Aumento significativo en revenue o nueva linea revenue">💰 Aumento significativo en revenue o nueva linea revenue</option>
                        <option value="Aumento moderado en revenue existente">📈 Aumento moderado en revenue existente</option>
                        <option value="Impacto menor o dificil de cuantificar">📊 Impacto menor o dificil de cuantificar</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEconomicImpactColor(initiativeData.economicImpact)}`}>
                        {initiativeData.economicImpact.includes('significativo') ? '💰' :
                         initiativeData.economicImpact.includes('moderado') ? '📈' : '📊'} {initiativeData.economicImpact}
                                    </span>
                    )}
                                </div>

                  {/* Enfoque Competitivo */}
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <Zap size={20} className="inline mr-2" />
                      Enfoque Competitivo
                    </label>
                    {isEditMode ? (
                      <select
                        value={initiativeData.competitiveApproach}
                        onChange={(e) => setInitiativeData(prev => ({ ...prev, competitiveApproach: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Disrrustivo / Innovador">🚀 Disrrustivo / Innovador</option>
                        <option value="Mejora incremental">📈 Mejora incremental</option>
                        <option value="Paridad con competencia">⚖️ Paridad con competencia</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCompetitiveApproachColor(initiativeData.competitiveApproach)}`}>
                        {initiativeData.competitiveApproach.includes('Disrrustivo') ? '🚀' :
                         initiativeData.competitiveApproach.includes('incremental') ? '📈' : '⚖️'} {initiativeData.competitiveApproach}
                      </span>
                              )}
                            </div>
                          </div>

                {/* Impacto Económico - Descripción */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <FileText size={20} className="inline mr-2" />
                    Descripción del Impacto Económico
                  </label>
                  {isEditMode ? (
                    <textarea
                      value={initiativeData.economicImpactDescription}
                      onChange={(e) => setInitiativeData(prev => ({ ...prev, economicImpactDescription: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      rows={3}
                      placeholder="Describe el impacto económico de la iniciativa..."
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">{initiativeData.economicImpactDescription}</p>
                    )}
                  </div>

                {/* Impacto en Experiencia */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Activity size={20} className="inline mr-2" />
                    Impacto en Experiencia
                  </label>
                  {isEditMode ? (
                    <div className="space-y-2">
                      {['Contact Rate', 'Aprobación', 'Aceptación', 'Provisioning Rate', 'SLA de envíos', 'SLA de incidencias', 'BPS (Chargebacks)', 'Revisión Manual KYC'].map((item) => (
                        <label key={item} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={initiativeData.experienceImpact.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setInitiativeData(prev => ({
                                  ...prev,
                                  experienceImpact: [...prev.experienceImpact, item]
                                }));
                            } else {
                                setInitiativeData(prev => ({
                                  ...prev,
                                  experienceImpact: prev.experienceImpact.filter(impact => impact !== item)
                                }));
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{item}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {initiativeData.experienceImpact.map((impact, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {impact}
                        </span>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
                    )}
                    
            {activeTab === 'prod-it' && (
              <div className="space-y-4">
                {/* Tecnología */}
                <div className={`${getAreaColor('Tecnología')} rounded-xl p-4`}>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">{getAreaIcon('Tecnología')}</span>
                    Tecnología
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Semillas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semillas (días)
                      </label>
                      <input
                        type="number"
                        value={prodItData.techSeeds}
                        onChange={(e) => setProdItData(prev => ({ ...prev, techSeeds: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Días de semillas"
                        min="0"
                      />
                    </div>

                    {/* Certidumbre */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certidumbre (%)
                      </label>
                      <input
                        type="number"
                        value={prodItData.techCertainty}
                        onChange={(e) => setProdItData(prev => ({ ...prev, techCertainty: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Porcentaje de certidumbre"
                        min="0"
                        max="100"
                      />
                  </div>
                </div>

                  {/* Notas / Casuísticas */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notas / Casuísticas
                    </label>
                    <textarea
                      value={prodItData.techNotes}
                      onChange={(e) => setProdItData(prev => ({ ...prev, techNotes: e.target.value }))}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Notas técnicas y casuísticas..."
                    />
              </div>
                </div>

                {/* UX */}
                <div className={`${getAreaColor('UX')} rounded-xl p-4`}>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">{getAreaIcon('UX')}</span>
                    UX
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Semillas */}
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semillas (días)
                        </label>
                        <input
                          type="number"
                        value={prodItData.uxSeeds}
                        onChange={(e) => setProdItData(prev => ({ ...prev, uxSeeds: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Días de semillas"
                        min="0"
                        />
                      </div>

                    {/* Certidumbre */}
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Certidumbre (%)
                        </label>
                        <input
                          type="number"
                        value={prodItData.uxCertainty}
                        onChange={(e) => setProdItData(prev => ({ ...prev, uxCertainty: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Porcentaje de certidumbre"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                  {/* Casuísticas */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Casuísticas
                      </label>
                    <textarea
                      value={prodItData.uxCases}
                      onChange={(e) => setProdItData(prev => ({ ...prev, uxCases: e.target.value }))}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={3}
                      placeholder="Casuísticas de UX..."
                    />
                  </div>
                    </div>

                {/* Producto */}
                <div className={`${getAreaColor('Producto')} rounded-xl p-4`}>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-xl mr-2">{getAreaIcon('Producto')}</span>
                    Producto
                  </h4>
                  
                  {/* Casuísticas */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Casuísticas
                      </label>
                      <textarea
                      value={prodItData.productCases}
                      onChange={(e) => setProdItData(prev => ({ ...prev, productCases: e.target.value }))}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Casuísticas de producto..."
                    />
                  </div>

                  {/* Proveedores */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proveedores
                      </label>
                      <textarea
                      value={prodItData.productProviders}
                      onChange={(e) => setProdItData(prev => ({ ...prev, productProviders: e.target.value }))}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Proveedores involucrados..."
                      />
                    </div>

                  {/* Que No se contempla */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Que No se contempla
                      </label>
                      <textarea
                      value={prodItData.productNotConsidered}
                      onChange={(e) => setProdItData(prev => ({ ...prev, productNotConsidered: e.target.value }))}
                      className="w-full px-4 py-3 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder="Qué no se contempla en esta iniciativa..."
                      />
                    </div>
                    </div>
                  </div>
            )}

            {activeTab === 'dependency' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                      <button 
                    onClick={addNewDependency}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                    <Plus size={16} className="mr-1" />
                    Agregar Dependencia
                      </button>
                </div>

                {/* Grid de dependencias enviadas */}
                {dependencies.filter(dep => dep.sent).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dependencies.filter(dep => dep.sent).map((dependency) => (
                      <div key={dependency.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Área:</span>
                      <button 
                              onClick={() => removeDependency(dependency.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar dependencia"
                      >
                              <X size={16} />
                      </button>
                    </div>
                          <p className="text-lg font-semibold text-gray-900">{dependency.area}</p>
                          <div className="space-y-1">
                            <span className="text-sm font-medium text-gray-500">Descripción:</span>
                            <p className="text-sm text-gray-700">{dependency.description}</p>
                  </div>
                </div>
              </div>
                    ))}
            </div>
          )}

                {/* Formularios de dependencias pendientes */}
                {dependencies.filter(dep => !dep.sent).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-700">Dependencias pendientes de envío:</h4>
                    {dependencies.filter(dep => !dep.sent).map((dependency) => (
                      <div key={dependency.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center space-x-3">
                          {/* Campo de búsqueda de área */}
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              value={currentDependencyId === dependency.id ? currentAreaSearch : dependency.area}
                              onChange={(e) => {
                                if (currentDependencyId === dependency.id) {
                                  handleAreaSearchChange(e.target.value);
                                }
                              }}
                              onFocus={() => {
                                setCurrentDependencyId(dependency.id);
                                setCurrentAreaSearch(dependency.area);
                                setShowAreaDropdown(true);
                              }}
                              placeholder="Buscar área..."
                              className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            
                            {/* Dropdown de áreas */}
                            {showAreaDropdown && currentDependencyId === dependency.id && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {filteredAreas.map(area => (
                                  <div
                                    key={area}
                                    onClick={() => handleAreaSelect(area, dependency.id)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  >
                                    <p className="text-sm font-medium text-gray-900">{area}</p>
                    </div>
                                ))}
                        </div>
                            )}
                  </div>

                          {/* Campo de descripción */}
                          {dependency.area && (
                    <div className="flex-1">
                              <input
                                type="text"
                                value={dependency.description}
                                onChange={(e) => handleDescriptionChange(dependency.id, e.target.value)}
                                placeholder="Descripción de la dependencia..."
                                className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                        </div>
                          )}

                          {/* Botón de envío */}
                          {dependency.area && dependency.description && (
                            <button
                              onClick={() => sendDependency(dependency.id)}
                              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title="Enviar dependencia"
                            >
                              <Send size={16} />
                            </button>
                          )}

                          {/* Botón de eliminar */}
                          <button
                            onClick={() => removeDependency(dependency.id)}
                            className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            title="Eliminar dependencia"
                          >
                            <X size={16} />
                          </button>
                      </div>
                    </div>
                    ))}
                  </div>
                )}

                {/* Estado vacío */}
                {dependencies.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>No hay dependencias agregadas</p>
                    <p className="text-sm">Haz clic en "Agregar Dependencia" para comenzar</p>
                </div>
                )}
            </div>
          )}

          {activeTab === 'activity' && (
              <InitiativeActivityLog />
            )}
                
                  </div>

          </div>
        </div>
      </main>
    </div>
  );
}