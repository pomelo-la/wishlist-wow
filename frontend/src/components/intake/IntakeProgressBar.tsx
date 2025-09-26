import { IntakeProgress } from '@/services/agentService';

interface IntakeProgressBarProps {
  progress: IntakeProgress;
}

export default function IntakeProgressBar({ progress }: IntakeProgressBarProps) {
  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium text-gray-900">Progreso del Intake</h3>
        <span className="text-sm font-semibold text-blue-600">
          {Math.round(progress.completionPercentage)}%
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress.completionPercentage}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-600">
        <span className="font-medium">{progress.completedFields.length}</span> de{' '}
        <span className="font-medium">{progress.totalRequiredFields.length}</span> campos completados
      </div>
      
      {progress.isComplete && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800 font-medium">
            ✅ Información completa. Listo para crear la iniciativa.
          </p>
        </div>
      )}
      
      <div className="mt-3">
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
            Ver campos completados
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {progress.totalRequiredFields.map((field) => (
              <div 
                key={field}
                className={`text-xs px-2 py-1 rounded ${
                  progress.completedFields.includes(field)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {field.replace('_', ' ')}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
