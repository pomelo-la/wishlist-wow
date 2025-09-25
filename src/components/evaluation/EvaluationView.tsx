'use client';

import { useState } from 'react';
import { Initiative } from '@/types/initiative';
import { X, Send, Tag, AlertTriangle, BarChart2, FileText, Clock, Percent, Calendar } from 'lucide-react';

interface EvaluationViewProps {
  initiative: Initiative;
  onClose: () => void;
  onStatusChange: (newStatus: string, updatedFields?: any) => void;
}

interface ReviewMessage {
  id: string;
  author: string;
  role: 'business' | 'product' | 'tech' | 'ux';
  content: string;
  tags: string[];
  timestamp: Date;
}

interface StructuredFields {
  effortDays: number;
  confidence: number;
  risks: string[];
  dependencies: string[];
  benchmarks: string;
  uncoveredCases: string;
  regulatoryNotes: string;
  quarter: string;
}

export default function EvaluationView({ initiative, onClose, onStatusChange }: EvaluationViewProps) {
  const [reviewMessages, setReviewMessages] = useState<ReviewMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentRole] = useState<'business' | 'product' | 'tech' | 'ux'>('tech'); // TODO: From auth
  
  const [structuredFields, setStructuredFields] = useState<StructuredFields>({
    effortDays: initiative.effortEstimate || 0,
    confidence: initiative.confidence || 0,
    risks: [],
    dependencies: [],
    benchmarks: '',
    uncoveredCases: '',
    regulatoryNotes: '',
    quarter: initiative.quarter || ''
  });

  const availableTags = [
    'estimación', 'benchmark', 'riesgo', 'dependencia', 
    'regulación', 'arquitectura', 'ux', 'negocio'
  ];

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const newMessage: ReviewMessage = {
      id: Date.now().toString(),
      author: 'Current User', // TODO: From auth
      role: currentRole,
      content: currentMessage,
      tags: selectedTags,
      timestamp: new Date()
    };

    setReviewMessages(prev => [...prev, newMessage]);
    setCurrentMessage('');
    setSelectedTags([]);
  };

  const handleSaveDraft = () => {
    // Save structured fields without changing status
    onStatusChange(initiative.status, structuredFields);
    // Show some feedback to user that draft was saved
    alert('Borrador guardado correctamente');
  };

  const handleCloseEvaluation = () => {
    // Show confirmation dialog before closing evaluation
    const isConfirmed = window.confirm(
      'Estas moviendo de estado esta iniciativa, estas seguro que tiene todo lo necesario?'
    );
    
    if (isConfirmed) {
      // Save structured fields to initiative and move to closure
      onStatusChange('closure', structuredFields);
      onClose();
    }
  };

  const getRoleColor = (role: string) => {
    const colors = {
      business: 'bg-green-100 text-green-800',
      product: 'bg-blue-100 text-blue-800',
      tech: 'bg-purple-100 text-purple-800',
      ux: 'bg-pink-100 text-pink-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTagColor = (tag: string) => {
    const colors = {
      estimación: 'bg-blue-100 text-blue-800',
      benchmark: 'bg-green-100 text-green-800',
      riesgo: 'bg-red-100 text-red-800',
      dependencia: 'bg-yellow-100 text-yellow-800',
      regulación: 'bg-orange-100 text-orange-800',
      arquitectura: 'bg-purple-100 text-purple-800',
      ux: 'bg-pink-100 text-pink-800',
      negocio: 'bg-indigo-100 text-indigo-800'
    };
    return colors[tag as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Evaluación Técnica/Negocio</h2>
            <p className="text-sm text-gray-600 mt-1">{initiative.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Panel A: Initiative Details (Left) */}
          <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">📋 Ficha de la Iniciativa</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problema a resolver</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {initiative.summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <p className="text-sm text-gray-900 capitalize bg-gray-50 p-2 rounded-md">
                      {initiative.category.replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vertical</label>
                    <p className="text-sm text-gray-900 capitalize bg-gray-50 p-2 rounded-md">
                      {initiative.vertical.replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                      {initiative.country}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                    <p className="text-sm text-gray-900 capitalize bg-gray-50 p-2 rounded-md">
                      {initiative.clientType.replace('-', ' ')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impacto Económico</label>
                  <p className="text-sm text-gray-900 capitalize bg-gray-50 p-2 rounded-md">
                    {initiative.economicImpact}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de Innovación</label>
                  <p className="text-sm text-gray-900 capitalize bg-gray-50 p-2 rounded-md">
                    {initiative.innovationLevel}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Creado por</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded-md">
                    {initiative.createdBy} • {initiative.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Panel B: Review Chat (Center) */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">💬 Chat de Evaluación</h3>
              <p className="text-sm text-gray-600">Tech/Product/UX/Negocio pueden agregar contexto</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {reviewMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No hay mensajes aún. Comenzá la evaluación agregando tu contexto.</p>
                </div>
              ) : (
                reviewMessages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getRoleColor(message.role)}`}>
                        {message.role.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{message.author}</span>
                          <span className="text-xs text-gray-500">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-2">{message.content}</p>
                        {message.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {message.tags.map((tag) => (
                              <span
                                key={tag}
                                className={`inline-flex px-2 py-1 text-xs rounded-full ${getTagColor(tag)}`}
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

            {/* Chat Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Tags (opcional)</label>
                <div className="flex flex-wrap gap-1">
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
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Agregá tu evaluación o contexto..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Side Panel: Structured Fields (Right) */}
          <div className="w-80 border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">⚙️ Campos Estructurados</h3>
              
              <div className="space-y-4">
                {/* Esfuerzo y Confianza en la misma fila */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock size={16} className="inline mr-1" />
                      Esfuerzo (días)
                    </label>
                    <input
                      type="number"
                      value={structuredFields.effortDays}
                      onChange={(e) => setStructuredFields(prev => ({ 
                        ...prev, 
                        effortDays: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Percent size={16} className="inline mr-1" />
                      Confianza (%)
                    </label>
                    <input
                      type="number"
                      value={structuredFields.confidence}
                      onChange={(e) => setStructuredFields(prev => ({ 
                        ...prev, 
                        confidence: parseInt(e.target.value) || 0 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Quarter
                  </label>
                  <select
                    value={structuredFields.quarter}
                    onChange={(e) => setStructuredFields(prev => ({ 
                      ...prev, 
                      quarter: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="">Seleccionar Quarter</option>
                    <option value="Q1">Q1 2024</option>
                    <option value="Q2">Q2 2024</option>
                    <option value="Q3">Q3 2024</option>
                    <option value="Q4">Q4 2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle size={16} className="inline mr-1" />
                    Riesgos/Dependencias
                  </label>
                  <div className="space-y-2">
                    {structuredFields.risks.map((risk, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {risk}
                        </span>
                        <button
                          onClick={() => setStructuredFields(prev => ({
                            ...prev,
                            risks: prev.risks.filter((_, i) => i !== index)
                          }))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BarChart2 size={16} className="inline mr-1" />
                    Benchmarks
                  </label>
                  <textarea
                    value={structuredFields.benchmarks}
                    onChange={(e) => setStructuredFields(prev => ({ 
                      ...prev, 
                      benchmarks: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={3}
                    placeholder="Links y notas de benchmarks"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <AlertTriangle size={16} className="inline mr-1" />
                    Casuísticas no alcanzadas
                  </label>
                  <textarea
                    value={structuredFields.uncoveredCases}
                    onChange={(e) => setStructuredFields(prev => ({ 
                      ...prev, 
                      uncoveredCases: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={3}
                    placeholder="Casos o escenarios no cubiertos por la solución"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText size={16} className="inline mr-1" />
                    Notas Regulatorias
                  </label>
                  <textarea
                    value={structuredFields.regulatoryNotes}
                    onChange={(e) => setStructuredFields(prev => ({ 
                      ...prev, 
                      regulatoryNotes: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    rows={3}
                    placeholder="Consideraciones regulatorias"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={handleSaveDraft}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Guardar Borrador
                </button>
                
                <button
                  onClick={handleCloseEvaluation}
                  className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Cerrar Evaluación
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Guarda y mueve a "Cierre de evaluación"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}