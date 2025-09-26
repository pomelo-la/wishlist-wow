'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { mockInitiatives } from '@/data/mockData';
import { Initiative } from '@/types/initiative';
import Header from '@/components/layout/Header';
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
  ClipboardCheck
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

  const [structuredFields, setStructuredFields] = useState({
    effortDays: 0,
    confidence: 0,
    quarter: '',
    benchmarks: '',
    uncoveredCases: '',
    regulatoryNotes: ''
  });

  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [isSendingReview, setIsSendingReview] = useState(false);
  const [slackUsers, setSlackUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    if (params.id) {
      const foundInitiative = mockInitiatives.find(i => i.id === params.id);
      setInitiative(foundInitiative || null);
      
      if (foundInitiative) {
        setStructuredFields({
          effortDays: foundInitiative.effortEstimate || 0,
          confidence: foundInitiative.confidence || 0,
          quarter: foundInitiative.quarter || '',
          benchmarks: '',
          uncoveredCases: '',
          regulatoryNotes: ''
        });
      }
      
      // Simular loading
      setTimeout(() => setIsLoading(false), 800);
    }
  }, [params.id]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableTags = [
    'estimacion', 'benchmark', 'riesgo', 'dependencia', 
    'regulacion', 'arquitectura', 'ux', 'negocio'
  ];

  // Función para cargar usuarios de Slack
  const loadSlackUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch('http://localhost:8080/api/slack/users');
      const data = await response.json();
      if (data.success) {
        setSlackUsers(data.users || []);
      } else {
        console.error('Error loading Slack users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching Slack users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Filtrar usuarios basado en el término de búsqueda
  const filteredUsers = slackUsers.filter(user => 
    user.real_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: ReviewMessage = {
      id: Date.now().toString(),
      author: 'Current User',
      role: 'tech',
      content: currentMessage,
      tags: selectedTags,
      timestamp: new Date()
    };

    setReviewMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    setSelectedTags([]);
  };

  const handleSendReview = async () => {
    if (selectedReviewers.length === 0 || !reviewComment.trim() || isSendingReview) return;

    setIsSendingReview(true);

    try {
      // Crear el mensaje para Slack
      const message = `🔍 *Nueva revisión de tarjeta*\n\n` +
        `*Iniciativa:* ${initiative?.title}\n` +
        `*Estado:* ${initiative?.status.replace('-', ' ')}\n` +
        `*Categoría:* ${initiative?.category.replace('-', ' ')}\n` +
        `*País:* ${initiative?.country}\n\n` +
        `*Comentario:*\n${reviewComment}`;

      // Enviar mensaje a cada usuario seleccionado
      const promises = selectedReviewers.map(async (userId) => {
        const response = await fetch('http://localhost:8080/api/slack/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            channel: userId,
            text: message
          })
        });
        return response;
      });

      const responses = await Promise.all(promises);
      const successful = responses.filter(r => r.ok).length;
      
      if (successful === selectedReviewers.length) {
        alert(`✅ Revisión enviada exitosamente a ${successful} usuario(s)`);
        // Limpiar formulario
        setSelectedReviewers([]);
        setReviewComment('');
        setUserSearchTerm('');
      } else {
        alert(`⚠️ Revisión enviada a ${successful} de ${selectedReviewers.length} usuarios`);
      }
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('❌ Error al enviar la revisión. Intenta nuevamente.');
    } finally {
      setIsSendingReview(false);
    }
  };

  // Función para agregar/quitar usuarios seleccionados
  const toggleUserSelection = (userId: string) => {
    setSelectedReviewers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Función para remover usuario seleccionado
  const removeSelectedUser = (userId: string) => {
    setSelectedReviewers(prev => prev.filter(id => id !== userId));
  };

  const handleSaveDraft = () => {
    // Aquí iría la llamada a API
    console.log('Saving draft...', structuredFields);
    
    // Micro-interacción: feedback visual
    const btn = document.querySelector('.save-btn');
    btn?.classList.add('animate-pulse');
    setTimeout(() => btn?.classList.remove('animate-pulse'), 1000);
  };

  const handleCloseEvaluation = () => {
    const isConfirmed = window.confirm(
      'Estas moviendo de estado esta iniciativa, estas seguro que tiene todo lo necesario?'
    );
    
    if (isConfirmed) {
      // Aquí iría la llamada a API
      console.log('Closing evaluation...', structuredFields);
      router.push('/?tab=kanban');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'loaded': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'business-review': 'bg-blue-100 text-blue-800 border-blue-200', 
      'product-review': 'bg-purple-100 text-purple-800 border-purple-200',
      'closure': 'bg-orange-100 text-orange-800 border-orange-200',
      'prioritized': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 animate-pulse">Cargando iniciativa...</p>
        </div>
      </div>
    );
  }

  if (!initiative) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Iniciativa no encontrada</h2>
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
      <Header activeView="kanban" onViewChange={() => {}} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm mb-6">
          <button 
            onClick={() => router.push('/?tab=kanban')}
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            Kanban
          </button>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-medium">Evaluación</span>
        </div>

        {/* Hero section con info de la iniciativa */}
        <div className="h-full overflow-hidden">
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 mb-3 leading-tight">
                {initiative.title}
              </h1>
              <p className="text-slate-600 text-lg mb-4 leading-relaxed">
                {initiative.summary}
              </p>
              
              {/* Meta info con iconos */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center text-slate-600">
                  <User size={16} className="mr-2 text-blue-500" />
                  {initiative.createdBy}
                </div>
                <div className="flex items-center text-slate-600">
                  <Calendar size={16} className="mr-2 text-green-500" />
                  {initiative.createdAt.toLocaleDateString()}
                </div>
                {initiative.quarter && (
                  <div className="flex items-center text-slate-600">
                    <Target size={16} className="mr-2 text-purple-500" />
                    {initiative.quarter}
                  </div>
                )}
                {initiative.score && (
                  <div className="flex items-center text-slate-600">
                    <Zap size={16} className="mr-2 text-yellow-500" />
                    Score: {initiative.score}
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex space-x-3">
              <button 
                onClick={handleSaveDraft}
                className="save-btn flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Save size={18} className="mr-2" />
                Guardar
              </button>
              <button 
                onClick={handleCloseEvaluation}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <CheckCircle size={18} className="mr-2" />
                Cerrar Evaluación
              </button>
            </div>
          </div>

          {/* Tabs creativos */}
          <div className="flex space-x-1 bg-slate-100/50 p-1 rounded-2xl">
            {[
              { id: 'overview', label: 'Vista General', icon: Eye },
              { id: 'evaluation', label: 'Chat Evaluación', icon: MessageSquare },
              { id: 'fields', label: 'Campos Técnicos', icon: Settings },
              { id: 'activity', label: 'Actividad', icon: Activity },
              { id: 'review', label: 'Revisión', icon: ClipboardCheck }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-lg transform scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <tab.icon size={18} className="mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido de tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {activeTab === 'overview' && (
            <>
              {/* Información detallada */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Detalles de la Iniciativa</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                        <div className="bg-slate-100 rounded-xl p-3 capitalize">
                          {initiative.category.replace('-', ' ')}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vertical</label>
                        <div className="bg-slate-100 rounded-xl p-3 capitalize">
                          {initiative.vertical.replace('-', ' ')}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                        <div className="bg-slate-100 rounded-xl p-3">
                          {initiative.country}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Cliente</label>
                        <div className="bg-slate-100 rounded-xl p-3 capitalize">
                          {initiative.clientType.replace('-', ' ')}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Impacto Económico</label>
                        <div className="bg-slate-100 rounded-xl p-3 capitalize">
                          {initiative.economicImpact}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nivel de Innovación</label>
                        <div className="bg-slate-100 rounded-xl p-3 capitalize">
                          {initiative.innovationLevel}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar con métricas */}
              <div className="space-y-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Métricas Clave</h3>
                  
                  <div className="space-y-4">
                    {initiative.effortEstimate && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                        <div className="flex items-center">
                          <Clock size={16} className="text-blue-600 mr-2" />
                          <span className="text-sm font-medium">Esfuerzo</span>
                        </div>
                        <span className="font-bold text-blue-700">{initiative.effortEstimate}d</span>
                      </div>
                    )}
                    
                    {initiative.confidence && (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                        <div className="flex items-center">
                          <Target size={16} className="text-green-600 mr-2" />
                          <span className="text-sm font-medium">Confianza</span>
                        </div>
                        <span className="font-bold text-green-700">{initiative.confidence}%</span>
                      </div>
                    )}
                    
                    {initiative.score && (
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                        <div className="flex items-center">
                          <Zap size={16} className="text-purple-600 mr-2" />
                          <span className="text-sm font-medium">Score</span>
                        </div>
                        <span className="font-bold text-purple-700">{initiative.score}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'evaluation' && (
            <>
              {/* Chat de evaluación */}
              <div className="lg:col-span-2">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 h-[600px] flex flex-col">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">Chat de Evaluación</h3>
                  
                  {/* Mensajes */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {reviewMessages.length === 0 ? (
                      <div className="text-center py-16 text-slate-500">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No hay mensajes aún. Comenzá la evaluación agregando tu contexto.</p>
                      </div>
                    ) : (
                      reviewMessages.map((message) => (
                        <div key={message.id} className="flex space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${getRoleColor(message.role)}`}>
                            {message.role.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-white/20">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-slate-900">{message.author}</span>
                                <span className="text-xs text-slate-500">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-slate-700 mb-2">{message.content}</p>
                              {message.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {message.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input de mensaje */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            if (selectedTags.includes(tag)) {
                              setSelectedTags(prev => prev.filter(t => t !== tag));
                            } else {
                              setSelectedTags(prev => [...prev, tag]);
                            }
                          }}
                          className={`px-3 py-1 text-xs rounded-full border transition-all transform hover:scale-105 ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Agregá tu evaluación o contexto..."
                        className="flex-1 px-4 py-3 bg-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!currentMessage.trim()}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar con acciones rápidas */}
              <div className="space-y-6">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Acciones Rápidas</h3>
                  
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
                      <MessageSquare size={16} className="mr-2" />
                      Generar Resumen
                    </button>
                    
                    <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
                      <AlertCircle size={16} className="mr-2" />
                      Marcar Riesgos
                    </button>
                    
                    <button className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
                      <BarChart2 size={16} className="mr-2" />
                      Ver Benchmarks
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'fields' && (
            <div className="lg:col-span-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Campos Estructurados</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    {/* Esfuerzo y Confianza en la misma fila */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Clock size={16} className="inline mr-2 text-blue-500" />
                          Esfuerzo (días)
                        </label>
                        <input
                          type="number"
                          value={structuredFields.effortDays}
                          onChange={(e) => setStructuredFields(prev => ({ 
                            ...prev, 
                            effortDays: parseInt(e.target.value) || 0 
                          }))}
                          className="w-full px-4 py-3 bg-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <Percent size={16} className="inline mr-2 text-green-500" />
                          Confianza (%)
                        </label>
                        <input
                          type="number"
                          value={structuredFields.confidence}
                          onChange={(e) => setStructuredFields(prev => ({ 
                            ...prev, 
                            confidence: parseInt(e.target.value) || 0 
                          }))}
                          className="w-full px-4 py-3 bg-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    {/* Quarter */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <Calendar size={16} className="inline mr-2 text-purple-500" />
                        Quarter
                      </label>
                      <select
                        value={structuredFields.quarter}
                        onChange={(e) => setStructuredFields(prev => ({ 
                          ...prev, 
                          quarter: e.target.value 
                        }))}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                      >
                        <option value="">Seleccionar Quarter</option>
                        <option value="Q1">Q1 2024</option>
                        <option value="Q2">Q2 2024</option>
                        <option value="Q3">Q3 2024</option>
                        <option value="Q4">Q4 2024</option>
                      </select>
                    </div>

                    {/* Benchmarks */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <BarChart2 size={16} className="inline mr-2 text-indigo-500" />
                        Benchmarks
                      </label>
                      <textarea
                        value={structuredFields.benchmarks}
                        onChange={(e) => setStructuredFields(prev => ({ 
                          ...prev, 
                          benchmarks: e.target.value 
                        }))}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
                        rows={4}
                        placeholder="Links y notas de benchmarks"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Casuísticas no alcanzadas */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <AlertCircle size={16} className="inline mr-2 text-orange-500" />
                        Casuísticas no alcanzadas
                      </label>
                      <textarea
                        value={structuredFields.uncoveredCases}
                        onChange={(e) => setStructuredFields(prev => ({ 
                          ...prev, 
                          uncoveredCases: e.target.value 
                        }))}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 resize-none"
                        rows={4}
                        placeholder="Casos o escenarios no cubiertos por la solución"
                      />
                    </div>

                    {/* Notas Regulatorias */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        <FileText size={16} className="inline mr-2 text-red-500" />
                        Notas Regulatorias
                      </label>
                      <textarea
                        value={structuredFields.regulatoryNotes}
                        onChange={(e) => setStructuredFields(prev => ({ 
                          ...prev, 
                          regulatoryNotes: e.target.value 
                        }))}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 resize-none"
                        rows={4}
                        placeholder="Consideraciones regulatorias"
                      />
                    </div>

                    {/* Acciones */}
                    <div className="flex space-x-4 pt-4">
                      <button 
                        onClick={handleSaveDraft}
                        className="flex-1 flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <Save size={20} className="mr-2" />
                        Guardar Borrador
                      </button>
                      
                      <button 
                        onClick={handleCloseEvaluation}
                        className="flex-1 flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <CheckCircle size={20} className="mr-2" />
                        Cerrar Evaluación
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="lg:col-span-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Timeline de Actividad</h3>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">Iniciativa creada</span>
                          <span className="text-xs text-slate-500">{initiative.createdAt.toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-600 text-sm">por {initiative.createdBy}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock size={16} className="text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-white rounded-xl p-4 shadow-sm border border-white/20">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-slate-900">Estado actual</span>
                          <span className="text-xs text-slate-500">Ahora</span>
                        </div>
                        <p className="text-slate-600 text-sm capitalize">{initiative.status.replace('-', ' ')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="lg:col-span-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6 flex items-center">
                  <ClipboardCheck size={24} className="mr-3 text-blue-600" />
                  Crear Revisión de Tarjeta
                </h3>
                
                <div className="space-y-6">
                  {/* Información de la iniciativa */}
                  <div className="bg-slate-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4">Iniciativa a Revisar</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                        <p className="text-slate-900 font-medium">{initiative?.title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                        <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {initiative?.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Categoría</label>
                        <p className="text-slate-900 capitalize">{initiative?.category.replace('-', ' ')}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
                        <p className="text-slate-900">{initiative?.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de revisión */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Enviar revisión de tarjeta a
                      </label>
                      
                      {/* Usuarios seleccionados */}
                      {selectedReviewers.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {selectedReviewers.map(userId => {
                            const user = slackUsers.find(u => u.id === userId);
                            return (
                              <span
                                key={userId}
                                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                              >
                                {user?.real_name || user?.name || userId}
                                <button
                                  onClick={() => removeSelectedUser(userId)}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Search input */}
                      <div className="relative user-dropdown-container">
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => {
                            setUserSearchTerm(e.target.value);
                            setShowUserDropdown(true);
                          }}
                          onFocus={() => setShowUserDropdown(true)}
                          placeholder="Buscar usuarios de Slack..."
                          className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
                        />
                        
                        {/* Botón para cargar usuarios */}
                        <button
                          onClick={loadSlackUsers}
                          disabled={isLoadingUsers}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {isLoadingUsers ? 'Cargando...' : 'Cargar'}
                        </button>

                        {/* Dropdown de usuarios */}
                        {showUserDropdown && userSearchTerm && filteredUsers.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {filteredUsers.map(user => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  toggleUserSelection(user.id);
                                  setUserSearchTerm('');
                                  setShowUserDropdown(false);
                                }}
                                className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 ${
                                  selectedReviewers.includes(user.id) ? 'bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {user.real_name || user.name}
                                    </div>
                                    {user.email && (
                                      <div className="text-sm text-slate-500">{user.email}</div>
                                    )}
                                  </div>
                                  {selectedReviewers.includes(user.id) && (
                                    <div className="text-blue-600">✓</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Comentario de revisión
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Agregar comentarios sobre la revisión..."
                        rows={4}
                        className="w-full px-4 py-3 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder-slate-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSendReview}
                        disabled={selectedReviewers.length === 0 || !reviewComment.trim() || isSendingReview}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 shadow-lg"
                      >
                        {isSendingReview ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send size={18} className="mr-2" />
                            Enviar a {selectedReviewers.length} usuario(s)
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}