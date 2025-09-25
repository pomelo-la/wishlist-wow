'use client';

import { useState } from 'react';
import { Send, Plus, Check, AlertCircle } from 'lucide-react';

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

const SECTIONS = [
  { id: 'context', name: 'Contexto', icon: '🎯' },
  { id: 'scope', name: 'Ámbito', icon: '🌎' },
  { id: 'economic', name: 'Impacto Económico', icon: '💰' },
  { id: 'experience', name: 'Impacto en Experiencia', icon: '✨' },
  { id: 'innovation', name: 'Innovación', icon: '🚀' },
  { id: 'dependencies', name: 'Dependencias y Riesgos', icon: '⚠️' }
];

const QUESTIONS = {
  context: [
    "¡Hola! Vamos a crear una nueva iniciativa. ¿Qué problema específico querés resolver?",
    "Perfecto. ¿Para quién es esta solución? ¿Qué cliente o segmento se beneficiaría?",
    "Entiendo. ¿Qué pasa si no implementamos esto en los próximos 90 días?"
  ],
  scope: [
    "Ahora definamos el ámbito. ¿En qué categoría encaja esta iniciativa?",
    "¿A qué vertical pertenece?",
    "¿En qué países o regiones se implementaría?",
    "¿Para qué tipo de cliente está dirigida?"
  ],
  economic: [
    "Hablemos del impacto económico. ¿Cómo calificarías el impacto?",
    "Contame brevemente el caso de negocio en 2-3 párrafos."
  ],
  experience: [
    "¿Qué aspectos de la experiencia del usuario se verían impactados? (Podés seleccionar varios)"
  ],
  innovation: [
    "¿Qué nivel de innovación representa esta iniciativa?"
  ],
  dependencies: [
    "Finalmente, ¿hay dependencias técnicas, regulatorias o de partners?",
    "¿Qué riesgos principales identificás?"
  ]
};

export default function IntakeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "¡Hola! Vamos a crear una nueva iniciativa. ¿Qué problema específico querés resolver?",
      section: 'context',
      timestamp: new Date()
    }
  ]);
  
  const [currentInput, setCurrentInput] = useState('');
  const [currentSection, setCurrentSection] = useState('context');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [completedSections, setCompletedSections] = useState<string[]>([]);

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Process response and move to next question
    setTimeout(() => {
      const nextQuestion = getNextQuestion();
      if (nextQuestion) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: nextQuestion.content,
          section: nextQuestion.section,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }
    }, 1000);

    setCurrentInput('');
  };

  const getNextQuestion = () => {
    const sectionQuestions = QUESTIONS[currentSection as keyof typeof QUESTIONS];
    const nextQuestionIndex = currentQuestion + 1;

    if (nextQuestionIndex < sectionQuestions.length) {
      setCurrentQuestion(nextQuestionIndex);
      return {
        content: sectionQuestions[nextQuestionIndex],
        section: currentSection
      };
    } else {
      // Move to next section
      const currentSectionIndex = SECTIONS.findIndex(s => s.id === currentSection);
      if (currentSectionIndex < SECTIONS.length - 1) {
        const nextSection = SECTIONS[currentSectionIndex + 1];
        setCompletedSections(prev => [...prev, currentSection]);
        setCurrentSection(nextSection.id);
        setCurrentQuestion(0);
        return {
          content: QUESTIONS[nextSection.id as keyof typeof QUESTIONS][0],
          section: nextSection.id
        };
      } else {
        // All sections completed
        setCompletedSections(prev => [...prev, currentSection]);
        return {
          content: "¡Excelente! He recopilado toda la información. Ahora voy a generar un resumen ejecutivo de tu iniciativa...",
          section: 'summary'
        };
      }
    }
  };

  const jumpToSection = (sectionId: string) => {
    setCurrentSection(sectionId);
    setCurrentQuestion(0);
    const firstQuestion = QUESTIONS[sectionId as keyof typeof QUESTIONS][0];
    
    const botMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: firstQuestion,
      section: sectionId,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMessage]);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar with sections */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Progreso</h3>
        <div className="space-y-2">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => jumpToSection(section.id)}
              className={`w-full flex items-center p-3 rounded-lg text-left transition-colors ${
                currentSection === section.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : completedSections.includes(section.id)
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="mr-3 text-lg">{section.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{section.name}</span>
                  {completedSections.includes(section.id) && (
                    <Check size={16} className="text-green-600" />
                  )}
                  {currentSection === section.id && (
                    <AlertCircle size={16} className="text-blue-600" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg p-4 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-2 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex space-x-4">
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Escribí tu respuesta aquí..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <button
              onClick={handleSendMessage}
              disabled={!currentInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}