interface AgentQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: string[];
  required: boolean;
}

interface AgentResponse {
  questions?: AgentQuestion[];
  suggestions?: any[];
  executive_summary?: string;
  confirmation_summary?: string;
  next_step: string;
  is_complete: boolean;
  extracted_data?: Record<string, any>;
  awaiting_confirmation?: boolean;
}

interface IntakeRequest {
  user_input: string;
  step: 'start' | 'continue' | 'validate';
  initiative?: any;
  context?: Record<string, any>;
}

export interface IntakeProgress {
  completedFields: string[];
  totalRequiredFields: string[];
  completionPercentage: number;
  isComplete: boolean;
}

export class AgentService {
  private baseUrl: string;
  private static lastProgress: number = 0;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  }

  async startIntake(userInput: string): Promise<AgentResponse> {
    return this.callAgentAPI({
      user_input: userInput,
      step: 'start'
    });
  }

  async continueIntake(userInput: string, context: Record<string, any>, initiative?: any): Promise<AgentResponse> {
    return this.callAgentAPI({
      user_input: userInput,
      step: 'continue',
      context,
      initiative
    });
  }

  async validateIntake(userInput: string, initiative: any, context: Record<string, any>): Promise<AgentResponse> {
    return this.callAgentAPI({
      user_input: userInput,
      step: 'validate',
      initiative,
      context
    });
  }

  async completeIntake(initiative: any, context: Record<string, any>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agent/intake/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initiative,
        context
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to complete intake: ${response.statusText}`);
    }

    return response.json();
  }

  private async callAgentAPI(request: IntakeRequest): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/agent/intake`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Agent API error: ${response.statusText}`);
    }

    return response.json();
  }

  // Reset progress when starting a new initiative
  static resetProgress(): void {
    this.lastProgress = 0;
  }

  // Utility function to track intake progress
  static trackProgress(formData: Record<string, any>): IntakeProgress {
    const requiredFields = [
      'title', 'summary', 'category', 'vertical',
      'countries', 'clientType', 'problem_description',
      'business_case', 'economic_impact', 'client_segment'
    ];
    
    const completedFields = requiredFields.filter(field => {
      const value = formData[field];
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value && value.toString().trim().length > 0;
    });
    
    // Calcular progreso base
    const baseProgress = (completedFields.length / requiredFields.length) * 100;
    
    // Agregar variación aleatoria más natural
    const randomVariation = Math.random() * 12 - 6; // -6 a +6
    const naturalProgress = Math.max(0, Math.min(100, baseProgress + randomVariation));
    
    // Asegurar que el progreso siempre aumente gradualmente
    const currentProgress = this.lastProgress || 0;
    const minIncrease = Math.max(3, Math.floor(Math.random() * 8) + 2); // 3-10 puntos mínimo
    const finalProgress = Math.max(currentProgress + minIncrease, Math.round(naturalProgress));
    
    // Limitar el progreso máximo basado en campos completados
    const maxAllowedProgress = Math.min(100, (completedFields.length / requiredFields.length) * 100 + 15);
    const cappedProgress = Math.min(finalProgress, maxAllowedProgress);
    
    this.lastProgress = cappedProgress;
    
    return {
      completedFields,
      totalRequiredFields: requiredFields,
      completionPercentage: cappedProgress,
      isComplete: completedFields.length >= requiredFields.length
    };
  }

  // Map frontend data to backend format
  static mapToBackendFormat(frontendData: Record<string, any>): any {
    return {
      title: frontendData.title || '',
      summary: frontendData.summary || '',
      category: this.mapCategory(frontendData.category),
      vertical: this.mapVertical(frontendData.vertical),
      countries: Array.isArray(frontendData.countries) ? frontendData.countries : (frontendData.country ? [frontendData.country] : []),
      client_type: this.mapClientType(frontendData.clientType),
      economic_impact_type: this.mapEconomicImpact(frontendData.economicImpact),
      innovation_level: this.mapInnovationLevel(frontendData.innovationLevel),
      description: frontendData.business_case || '',
      client: frontendData.client_segment || '',
      systemic_risk: this.mapRiskLevel(frontendData.systemicRisk)
    };
  }

  private static mapCategory(category: string): string {
    const mapping: Record<string, string> = {
      'mandates': 'regulatory',
      'performance': 'performance',
      'value-prop': 'value_prop',
      'new-product': 'new_product'
    };
    return mapping[category] || category;
  }

  private static mapVertical(vertical: string): string {
    const mapping: Record<string, string> = {
      'processing': 'banking',
      'core': 'banking',
      'bin-sponsor': 'banking',
      'card-mgmt': 'banking',
      'tokenization': 'banking',
      'fraud': 'banking',
      'platform': 'banking'
    };
    return mapping[vertical] || 'banking';
  }

  private static mapClientType(clientType: string): string {
    const mapping: Record<string, string> = {
      'all': 'top_issuer',
      'top-issuer': 'top_issuer',
      'tier1': 'major',
      'tier2': 'medium',
      'tier3': 'small'
    };
    return mapping[clientType] || clientType;
  }

  private static mapEconomicImpact(economicImpact: string): string {
    const mapping: Record<string, string> = {
      'significant': 'significant',
      'moderate': 'moderate',
      'low': 'low'
    };
    return mapping[economicImpact] || 'moderate';
  }

  private static mapInnovationLevel(innovationLevel: string): string {
    const mapping: Record<string, string> = {
      'disruptive': 'disruptive',
      'incremental': 'incremental',
      'parity': 'parity'
    };
    return mapping[innovationLevel] || 'incremental';
  }

  private static mapRiskLevel(riskLevel: string): string {
    const mapping: Record<string, string> = {
      'blocker': 'blocker',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    return mapping[riskLevel] || 'medium';
  }
}

export default AgentService;
