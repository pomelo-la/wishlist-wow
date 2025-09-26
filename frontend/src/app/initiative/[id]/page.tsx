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
  ClipboardCheck,
  ChevronRight
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
  const [isLoading, setIsLoading] = useState(false);

  const [structuredFields, setStructuredFields] = useState({
    effortDays: 0,
    confidence: 0,
    quarter: '',
    notes: '',
    unreachedCases: ''
  });

  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState('');
  const [isSendingReview, setIsSendingReview] = useState(false);
  const [slackUsers, setSlackUsers] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Cargar datos inmediatamente sin spinner
  const foundInitiative = mockInitiatives.find(i => i.id === params.id);
  if (!initiative && foundInitiative) {
    setInitiative(foundInitiative);
    
    // Cargar mensajes de revisión simulados
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

  // Función para manejar cambios en el input de búsqueda
  const handleUserSearchChange = (value: string) => {
    setUserSearchTerm(value);
    
    // Si no hay usuarios cargados y el término tiene al menos 2 caracteres, cargar usuarios
    if (slackUsers.length === 0 && value.length >= 2) {
      loadSlackUsers();
    }
    
    // Mostrar dropdown si hay término de búsqueda
    setShowUserDropdown(value.length > 0);
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

  const getRoleColor = (role: string) => {
    const colors = {
      business: 'bg-emerald-500',
      product: 'bg-blue-500',
      tech: 'bg-purple-500',
      ux: 'bg-pink-500'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500';
  };

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
        <div className="w-1/2 flex flex-col">
          {/* Initiative Header */}
          <div className="p-6">
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
              <button 
                onClick={() => router.push('/?tab=kanban')}
                className="flex items-center hover:text-gray-700 transition-colors"
              >
                <ArrowLeft size={16} className="mr-1" />
                Kanban
              </button>
              <ChevronRight size={16} />
              <span>Evaluación</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {initiative.title}
            </h1>
            
            {/* Metadata */}
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <User size={16} className="mr-2" />
                {initiative.createdBy}
              </div>
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                {initiative.createdAt.toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Target size={16} className="mr-2" />
                {initiative.quarter}
              </div>
              <div className="flex items-center">
                <Zap size={16} className="mr-2" />
                Score: {initiative.score}
              </div>
            </div>
          </div>

          {/* Chat Messages Area - Integrated style */}
          <div className="flex-1 mx-6 mb-6">
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
        <div className="w-1/2 bg-white flex flex-col">
          {/* Tabs - Using Header style */}
          <div className="p-4">
            <nav className="flex bg-gray-100 rounded-lg p-1">
              {[
                { id: 'overview', label: 'Vista general', icon: Eye },
                { id: 'prod-it', label: 'Prod & IT', icon: Settings },
                { id: 'dependency', label: 'Dependencia', icon: FileText },
                { id: 'activity', label: 'Activity', icon: Activity },
                { id: 'review', label: 'Revisión', icon: ClipboardCheck }
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

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimación Tech
                  </label>
                  <input
                    type="number"
                    value={structuredFields.effortDays}
                    onChange={(e) => setStructuredFields(prev => ({ ...prev, effortDays: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Días de esfuerzo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confianza %
                  </label>
                  <input
                    type="number"
                    value={structuredFields.confidence}
                    onChange={(e) => setStructuredFields(prev => ({ ...prev, confidence: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Porcentaje de confianza"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Casuísticas no alcanzadas
                  </label>
                  <textarea
                    value={structuredFields.unreachedCases}
                    onChange={(e) => setStructuredFields(prev => ({ ...prev, unreachedCases: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe las casuísticas que no se pueden alcanzar..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={structuredFields.notes}
                    onChange={(e) => setStructuredFields(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'prod-it' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Producto & IT</h3>
                <p className="text-gray-600">Información técnica y de producto...</p>
              </div>
            )}

            {activeTab === 'dependency' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Dependencias</h3>
                <p className="text-gray-600">Dependencias del proyecto...</p>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Actividad</h3>
                <p className="text-gray-600">Historial de actividad...</p>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ClipboardCheck size={20} className="mr-2 text-blue-600" />
                  Crear Revisión de Tarjeta
                </h3>
                
                <div className="space-y-4">
                  {/* Información de la iniciativa */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Iniciativa a Revisar</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Título</label>
                        <p className="text-sm text-gray-900 font-medium">{initiative?.title}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                          {initiative?.status.replace('-', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                        <p className="text-sm text-gray-900">{initiative?.category}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">País</label>
                        <p className="text-sm text-gray-900">{initiative?.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Selección de usuarios */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-900">
                      Seleccionar Revisores
                    </label>
                    
                    {/* Usuarios seleccionados */}
                    {selectedReviewers.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedReviewers.map(userId => {
                          const user = slackUsers.find(u => u.id === userId);
                          return (
                            <span
                              key={userId}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
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
                    <div className="relative">
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => handleUserSearchChange(e.target.value)}
                        onFocus={() => setShowUserDropdown(userSearchTerm.length > 0)}
                        placeholder="Buscar usuarios de Slack... (escribe 2+ caracteres)"
                        className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                      
                      {/* Botón para cargar usuarios - solo visible si no hay usuarios y término < 2 caracteres */}
                      {slackUsers.length === 0 && userSearchTerm.length < 2 && (
                        <button
                          onClick={loadSlackUsers}
                          disabled={isLoadingUsers}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          {isLoadingUsers ? 'Cargando...' : 'Cargar'}
                        </button>
                      )}

                      {/* Indicador de carga automática */}
                      {isLoadingUsers && userSearchTerm.length >= 2 && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}

                      {/* Dropdown de usuarios */}
                      {showUserDropdown && userSearchTerm && filteredUsers.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredUsers.map(user => (
                            <div
                              key={user.id}
                              onClick={() => {
                                toggleUserSelection(user.id);
                                setUserSearchTerm('');
                                setShowUserDropdown(false);
                              }}
                              className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                selectedReviewers.includes(user.id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {user.real_name || user.name}
                                  </p>
                                  {user.email && (
                                    <p className="text-xs text-gray-500">{user.email}</p>
                                  )}
                                </div>
                                {selectedReviewers.includes(user.id) && (
                                  <CheckCircle size={16} className="text-blue-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comentario de revisión */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-900">
                      Comentario de Revisión
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Escribe tu comentario de revisión aquí..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                  </div>

                  {/* Botón de envío */}
                  <button
                    onClick={handleSendReview}
                    disabled={selectedReviewers.length === 0 || !reviewComment.trim() || isSendingReview}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSendingReview ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Enviar a {selectedReviewers.length} usuario(s)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleSaveDraft}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} className="mr-2" />
              Guardar
            </button>
            <button
              onClick={handleCloseEvaluation}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={16} className="mr-2" />
              Cerrar Evaluación
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}