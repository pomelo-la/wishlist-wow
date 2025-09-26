'use client';

import { useState, useEffect } from 'react';
import { Send, Plus, Check, AlertCircle, Loader2 } from 'lucide-react';
import AgentService, { IntakeProgress } from '@/services/agentService';
import IntakeProgressBar from './IntakeProgressBar';

interface Message {
  id: string;
  type: 'bot' | 'user';
  content: string;
  section?: string;
  timestamp: Date;
}

interface FormData {
  problem: string;
  client: string;
  urgency: string;
  category: string;
  vertical: string;
  countries: string[];
  clientType: string;
  economicImpact: string;
  businessCase: string;
  experienceImpact: string[];
  innovation: string;
  dependencies: string;
  risks: string;
}


export default function IntakeChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [progress, setProgress] = useState<IntakeProgress>({
    completedFields: [],
    totalRequiredFields: [],
    completionPercentage: 0,
    isComplete: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const [agentService] = useState(new AgentService());

  // Initialize chat
  useEffect(() => {
    initializeChat();
  }, []);

  // Update progress when formData changes
  useEffect(() => {
    const newProgress = AgentService.trackProgress(formData);
    setProgress(newProgress);
  }, [formData]);

  const initializeChat = async () => {
    try {
      console.log('Inicializando chat...');
      setIsLoading(true);
      const response = await agentService.startIntake('Quiero crear una nueva iniciativa');

      console.log('Respuesta del backend:', response);

      if (response.questions && response.questions.length > 0) {
        console.log('Pregunta recibida:', response.questions[0].text);
        const botMessage: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: response.questions[0].text,
          section: 'context',
          timestamp: new Date()
        };
        setMessages([botMessage]);
      } else {
        console.warn('No se recibieron preguntas del backend');
        const fallbackMessage: Message = {
          id: '1',
          type: 'bot',
          content: "¡Hola! Vamos a crear una nueva iniciativa. ¿Qué problema específico querés resolver?",
          section: 'context',
          timestamp: new Date()
        };
        setMessages([fallbackMessage]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      // Fallback to static message
      const fallbackMessage: Message = {
        id: '1',
        type: 'bot',
        content: "¡Hola! Vamos a crear una nueva iniciativa. ¿Qué problema específico querés resolver?",
        section: 'context',
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Update form data with user input
      const updatedFormData = { ...formData };
      
      // Always store the conversation context
      if (!updatedFormData.conversation_history) {
        updatedFormData.conversation_history = [];
      }
      updatedFormData.conversation_history.push({
        user: currentInput,
        timestamp: new Date().toISOString()
      });

      // The LLM will extract structured data automatically, no need for manual extraction

      setFormData(updatedFormData);

      // Call agent API
      const response = await agentService.continueIntake(currentInput, updatedFormData);

      // Merge extracted data from LLM response
      if (response.extracted_data) {
        Object.assign(updatedFormData, response.extracted_data);
        setFormData(updatedFormData);
      }

      // Update awaiting_confirmation state
      if (response.awaiting_confirmation) {
        updatedFormData.awaiting_confirmation = true;
        setFormData(updatedFormData);
      } else {
        // Clear confirmation flag if not awaiting anymore
        delete updatedFormData.awaiting_confirmation;
        setFormData(updatedFormData);
      }

      if (response.is_complete) {
        // Use confirmation summary from agent response
        setExecutiveSummary(response.confirmation_summary || 'Resumen generado automáticamente');
        setIsComplete(true);
        
        const summaryMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.confirmation_summary || '¡Excelente! He recopilado toda la información necesaria.',
          section: 'summary',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, summaryMessage]);
      } else if (response.questions && response.questions.length > 0) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.questions[0].text,
          section: 'continue',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "Disculpa, hubo un error procesando tu respuesta. Por favor intenta de nuevo.",
        section: 'error',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setCurrentInput('');
    }
  };

  const handleTestInitiative = async () => {
    try {
      setIsLoading(true);
      
      // Collect all conversation content
      const conversationContent = messages
        .filter(msg => msg.type === 'user')
        .map(msg => msg.content)
        .join(' ');
      
      // Create a test message with the conversation content
      const testMessage = `TESTEAR INICIATIVA - Contenido de la conversación: ${conversationContent}`;
      
      // Add the test message to chat
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: testMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Send to agent to generate summary using validateIntake which triggers generateConfirmationSummary
      const response = await agentService.validateIntake(testMessage, formData, {
        conversation_history: messages
          .filter(msg => msg.type === 'user')
          .map(msg => ({ user: msg.content, timestamp: msg.timestamp }))
      });
      
      if (response && response.confirmation_summary) {
        // Add the summary as a bot message
        const summaryMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.confirmation_summary,
          section: 'summary',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, summaryMessage]);
        setExecutiveSummary(response.confirmation_summary);
      }
      
    } catch (error) {
      console.error('Error testing initiative:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `Error al generar el resumen: ${error}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteInitiative = async () => {
    if (!isComplete) return;

    try {
      setIsLoading(true);
      const backendInitiative = AgentService.mapToBackendFormat(formData);
      const result = await agentService.completeIntake(backendInitiative, formData);
      
      // Show success message
      const successMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: `¡Excelente! Tu iniciativa "${result.initiative.title}" ha sido creada exitosamente. ID: ${result.initiative.id}`,
        section: 'success',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({});
        setMessages([]);
        setIsComplete(false);
        setExecutiveSummary('');
        initializeChat();
      }, 3000);
      
    } catch (error) {
      console.error('Error completing initiative:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: "Hubo un error creando la iniciativa. Por favor intenta de nuevo.",
        section: 'error',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueQuestions = () => {
    setIsComplete(false);
    setExecutiveSummary('');
    
    // Add a message indicating we're continuing
    const continueMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: "Perfecto, continuemos con más preguntas para refinar la iniciativa.",
      section: 'continue',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, continueMessage]);
  };

  const jumpToSection = (sectionId: string) => {
    // This function is now simplified since we're using dynamic questions
    console.log('Jump to section:', sectionId);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar with progress */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Progreso del Intake</h3>
        
        {/* Progress Bar */}
        <IntakeProgressBar progress={progress} />
        
        {/* Executive Summary */}
        {executiveSummary && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Resumen Ejecutivo</h4>
            <div className="text-xs text-blue-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {executiveSummary}
            </div>
          </div>
        )}
        
        {/* Test and Complete Buttons */}
        <div className="mt-4 space-y-2">
          <button
            onClick={handleTestInitiative}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Testear Iniciativa
              </>
            )}
          </button>
          
          <button
            onClick={handleCompleteInitiative}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                Crear Iniciativa
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 size={20} className="animate-spin" />
                <span>Inicializando chat...</span>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white p-4 rounded-lg'
                      : message.section === 'summary'
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm'
                      : message.section === 'actions'
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg'
                      : message.section === 'confirm'
                      ? 'bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-lg'
                      : message.section === 'success'
                      ? 'bg-green-100 border border-green-300 text-green-800 p-4 rounded-lg'
                      : message.section === 'error'
                      ? 'bg-red-50 border border-red-200 text-red-900 p-4 rounded-lg'
                      : 'bg-white border border-gray-200 text-gray-900 p-4 rounded-lg'
                  }`}
                >
                  {/* Summary content with better formatting */}
                  {message.section === 'summary' && message.content.includes('¿Te parece correcto este contenido?') ? (
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Check size={16} className="text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-green-800">Resumen de la Iniciativa</h3>
                      </div>
                      
                      {/* Content with better formatting */}
                      <div className="space-y-4 mb-6">
                        {message.content.split('¿Te parece correcto este contenido?')[0].split('\n').map((line, index) => {
                          if (line.startsWith('**') && line.endsWith('**')) {
                            return (
                              <div key={index} className="border-l-4 border-green-300 pl-4">
                                <h4 className="text-base font-semibold text-green-800 mb-2">
                                  {line.replace(/\*\*/g, '')}
                                </h4>
                              </div>
                            );
                          } else if (line.trim()) {
                            return (
                              <p key={index} className="text-sm leading-relaxed text-green-900 ml-4">
                                {line}
                              </p>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      {/* Confirmation question */}
                      <div className="bg-white/60 rounded-lg p-4 mb-6 border border-green-200">
                        <p className="text-sm font-medium text-green-800 mb-4">
                          ¿Te parece correcto este contenido? Responde 'sí' para confirmar o 'no' para modificar.
                        </p>
                        
                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={handleCompleteInitiative}
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all duration-200 flex items-center justify-center"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Creando...
                              </>
                            ) : (
                              <>
                                <Check size={16} className="mr-2" />
                                Crear Iniciativa
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleContinueQuestions}
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all duration-200 flex items-center justify-center"
                          >
                            <Plus size={16} className="mr-2" />
                            Seguir Respondiendo
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Action buttons for other cases */}
                      {message.section === 'actions' && (
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={handleCompleteInitiative}
                            disabled={isLoading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 size={14} className="mr-1 animate-spin" />
                                Creando...
                              </>
                            ) : (
                              <>
                                <Check size={14} className="mr-1" />
                                Crear Iniciativa
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleContinueQuestions}
                            disabled={isLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            <Plus size={14} className="mr-1" />
                            Seguir Respondiendo
                          </button>
                        </div>
                      )}
                    </>
                  )}
                  
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
              placeholder={isComplete ? "Iniciativa completada" : "Escribí tu respuesta aquí..."}
              disabled={isComplete || isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentInput.trim() || isLoading || isComplete}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}