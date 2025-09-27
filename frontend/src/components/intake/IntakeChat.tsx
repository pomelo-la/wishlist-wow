'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  title: string;
  summary: string;
  category: string;
  vertical: string;
  countries: string[];
  clientType: string;
  problem_description: string;
  business_case: string;
  economic_impact: string;
  client_segment: string;
  // Legacy fields for backward compatibility
  problem: string;
  client: string;
  urgency: string;
  economicImpact: string;
  businessCase: string;
  experienceImpact: string[];
  innovation: string;
  dependencies: string;
  risks: string;
}


// Define the conversation flow with more human-like questions
const CONVERSATION_FLOW = [
  {
    field: 'title',
    question: '¡Perfecto! Empecemos por lo básico. ¿Cómo te gustaría llamar a esta iniciativa?',
    placeholder: 'Ej: Implementación de autenticación de dos factores'
  },
  {
    field: 'summary',
    question: 'Genial, me gusta el nombre. Ahora cuéntame en pocas palabras, ¿de qué se trata esta iniciativa?',
    placeholder: 'Ej: Implementar 2FA para mejorar la seguridad bancaria'
  },
  {
    field: 'category',
    question: 'Entiendo. Para clasificarla mejor, ¿dirías que esta iniciativa es más de cumplimiento regulatorio, mejora de performance, propuesta de valor, o lanzamiento de producto nuevo?',
    options: ['Mandates / Regulatorio / Riesgo', 'Mejora de performance', 'Value Prop', 'Lanzamiento nuevo producto'],
    type: 'select'
  },
  {
    field: 'vertical',
    question: 'Perfecto. Ahora, ¿en qué área de nuestro negocio se enfoca? ¿Es más de processing, core, BIN sponsor, o alguna otra vertical?',
    options: ['Processing', 'Core', 'BIN Sponsor', 'Card Management & Logistics', 'Tokenización', 'Fraud Tools', 'Platform experience'],
    type: 'select'
  },
  {
    field: 'countries',
    question: 'Excelente. ¿En qué países crees que tendría más impacto esta iniciativa?',
    options: ['Todos', 'Argentina', 'Brasil', 'Chile', 'Colombia', 'Mexico', 'ROLA'],
    type: 'multiselect'
  },
  {
    field: 'clientType',
    question: 'Muy bien. ¿Qué tipo de clientes se verían más beneficiados? ¿Todos nuestros clientes o algún segmento específico?',
    options: ['Todos', 'Top Issuer', 'Tier 1', 'Tier 2', 'Tier 3'],
    type: 'select'
  },
  {
    field: 'problem_description',
    question: 'Ahora cuéntame más en detalle, ¿qué problema específico estás viendo que esta iniciativa podría resolver?',
    placeholder: 'Describe el problema en detalle...'
  },
  {
    field: 'business_case',
    question: 'Interesante. ¿Por qué crees que es importante resolver este problema ahora? ¿Cuál es el caso de negocio detrás de esta iniciativa?',
    placeholder: 'Explica el valor de negocio...'
  },
  {
    field: 'economic_impact',
    question: 'Perfecto, me está quedando claro el valor. ¿Qué tipo de impacto económico esperarías? ¿Sería algo que genere revenue significativo, moderado, o es más difícil de cuantificar?',
    options: ['Aumento significativo en revenue o nueva linea revenue', 'Aumento moderado en revenue existente', 'Impacto menor o dificil de cuantificar'],
    type: 'select'
  },
  {
    field: 'client_segment',
    question: 'Última pregunta, ¿hay algún segmento específico de clientes al que te gustaría dirigir esta iniciativa?',
    placeholder: 'Ej: Bancos grandes, Fintechs, etc.'
  }
];

export default function IntakeChat() {
  const router = useRouter();
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
  
  // New state for guided conversation
  const [currentStep, setCurrentStep] = useState(0);
  const [isGuidedMode, setIsGuidedMode] = useState(true);

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
    if (isGuidedMode) {
      // Use guided conversation mode
      const welcomeMessage: Message = {
        id: '1',
        type: 'bot',
        content: '¡Hola! 👋 Soy tu asistente de Pomelo para ayudarte a crear nuevas iniciativas. Me encanta escuchar nuevas ideas y te voy a guiar paso a paso para que podamos estructurar tu propuesta de la mejor manera. ¿Listo para empezar?',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Start with the first question
      askNextQuestion();
    } else {
      // Use AI agent mode (original behavior)
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
    }
  };

  const askNextQuestion = () => {
    if (currentStep < CONVERSATION_FLOW.length) {
      const step = CONVERSATION_FLOW[currentStep];
      const questionMessage: Message = {
        id: `question-${currentStep}`,
        type: 'bot',
        content: step.question,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, questionMessage]);
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
      if (isGuidedMode) {
        // Handle guided conversation mode
        await handleGuidedResponse();
      } else {
        // Handle AI agent mode (original behavior)
        await handleAgentResponse();
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

  const handleGuidedResponse = async () => {
    if (currentStep < CONVERSATION_FLOW.length) {
      const step = CONVERSATION_FLOW[currentStep];
      const updatedFormData = { ...formData };
      
      // Store the user's response for the current field
      updatedFormData[step.field] = currentInput;
      setFormData(updatedFormData);
      
      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      if (nextStep < CONVERSATION_FLOW.length) {
        // Ask next question with confirmation
        const nextStepData = CONVERSATION_FLOW[nextStep];
        const confirmationResponses: Record<string, string> = {
          'title': '¡Perfecto! Me gusta el nombre que elegiste. ',
          'summary': 'Excelente, me queda claro de qué se trata. ',
          'category': 'Perfecto, esa categoría tiene mucho sentido. ',
          'vertical': 'Genial, esa vertical es muy importante para nosotros. ',
          'countries': 'Excelente alcance geográfico. ',
          'clientType': 'Perfecto, entiendo el segmento objetivo. ',
          'problem_description': 'Muy interesante, ese es un problema real que vale la pena resolver. ',
          'business_case': 'Excelente justificación, me convence el caso de negocio. ',
          'economic_impact': 'Perfecto, entiendo el potencial de impacto. ',
          'client_segment': 'Excelente, ya tengo una visión completa de tu iniciativa. '
        };
        
        const confirmation = confirmationResponses[step.field] || 'Perfecto, gracias por esa información. ';
        const combinedMessage = confirmation + nextStepData.question;
        
        const nextQuestionMessage: Message = {
          id: `question-${nextStep}`,
          type: 'bot',
          content: combinedMessage,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, nextQuestionMessage]);
      } else {
        // All questions completed
        const completionMessage: Message = {
          id: 'completion',
          type: 'bot',
          content: '¡Perfecto! 🎉 Me ha encantado conocer tu iniciativa. Tienes una propuesta muy interesante y creo que puede generar mucho valor para Pomelo. Ahora voy a organizar toda la información que me has compartido en un resumen ejecutivo para que puedas revisarlo.',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completionMessage]);
        
        // Generate executive summary
        console.log('About to generate executive summary with data:', updatedFormData);
        await generateExecutiveSummary(updatedFormData);
      }
    }
  };

  const handleAgentResponse = async () => {
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
  };

  const generateExecutiveSummary = async (data: Partial<FormData>) => {
    console.log('generateExecutiveSummary called with data:', data);
    try {
      // Create a more human-like executive summary
      const summary = `
**📋 Resumen de tu Iniciativa**

**🎯 Iniciativa:** ${data.title || 'No especificado'}
**📂 Categoría:** ${data.category || 'No especificado'}
**🏢 Vertical:** ${data.vertical || 'No especificado'}
**🌍 Alcance:** ${Array.isArray(data.countries) ? data.countries.join(', ') : data.countries || 'No especificado'}
**👥 Clientes Objetivo:** ${data.clientType || 'No especificado'}

**🔍 El Problema:**
${data.problem_description || 'No especificado'}

**💼 Por qué es Importante:**
${data.business_case || 'No especificado'}

**💰 Impacto Esperado:**
${data.economic_impact || 'No especificado'}

**🎯 Segmento Específico:**
${data.client_segment || 'No especificado'}

---
*¡Excelente trabajo! Tu iniciativa está lista para ser evaluada por el equipo. 🚀*
      `.trim();

      setExecutiveSummary(summary);
      setIsComplete(true);
      console.log('Executive summary generated, isComplete set to true');
      
      const summaryMessage: Message = {
        id: 'executive-summary',
        type: 'bot',
        content: summary,
        section: 'summary',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, summaryMessage]);
    } catch (error) {
      console.error('Error generating executive summary:', error);
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
    console.log('handleCompleteInitiative called - navigating to Kanban');
    console.log('Router object:', router);
    console.log('Current pathname:', window.location.pathname);
    
    // Show success message
    const successMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: '¡Perfecto! Te estoy llevando al Kanban para que puedas ver y gestionar tus iniciativas. 🚀',
      section: 'success',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, successMessage]);
    
    // Navigate to Kanban after 1 second
    setTimeout(() => {
      console.log('About to navigate to Kanban');
      try {
        router.push('/?tab=kanban');
        console.log('Navigation called to Kanban successfully');
      } catch (error) {
        console.error('Navigation error:', error);
        // Fallback: try window.location
        window.location.href = '/?tab=kanban';
        console.log('Fallback navigation used');
      }
    }, 1000);
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
    <div className="flex h-full bg-white">
      {/* Sidebar with progress */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Progreso del Intake</h3>
          <button
            onClick={() => setIsGuidedMode(!isGuidedMode)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              isGuidedMode 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            {isGuidedMode ? 'Modo Guiado' : 'Modo AI'}
          </button>
        </div>
        
        {/* Progress Bar */}
        <IntakeProgressBar progress={progress} />
        
        {/* Current Step Indicator (only in guided mode) */}
        {isGuidedMode && currentStep < CONVERSATION_FLOW.length && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-700 font-medium mb-1">
              Paso {currentStep + 1} de {CONVERSATION_FLOW.length}
            </div>
            <div className="text-xs text-blue-600">
              {CONVERSATION_FLOW[currentStep]?.question}
            </div>
          </div>
        )}
        
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
            onClick={() => {
              console.log('Button clicked - going to Kanban');
              handleCompleteInitiative();
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
          >
            <Check size={16} className="mr-2" />
            Crear Iniciativa
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
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