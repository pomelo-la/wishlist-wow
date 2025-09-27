const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Initiative {
  id: string;
  title: string;
  description: string;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  quarter: string;
  score: number;
  category: string;
  vertical: string;
  client_type: string;
  country: string;
  systemic_risk: string;
  economic_impact: string;
  economic_impact_description: string;
  experience_impact: string[];
  competitive_approach: string;
  executive_summary: string;
  roi: number;
}

export interface InitiativeListResponse {
  data: Initiative[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InitiativeStatsResponse {
  total_initiatives: number;
  category_counts: Array<{ category: string; count: number }>;
  vertical_counts: Array<{ vertical: string; count: number }>;
  country_counts: Array<{ country: string; count: number }>;
  status_counts: Array<{ status: string; count: number }>;
  average_score: number;
  average_roi: number;
  high_roi_count: number;
}

export interface KanbanStatusesResponse {
  statuses: string[];
}

export interface KanbanMoveRequest {
  new_status: string;
  previous_status?: string;
  moved_by?: string;
}

export interface KanbanMoveResponse {
  initiative_id: string;
  new_status: string;
  score?: number;
  message: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Kanban endpoints
  async getInitiatives(params?: {
    page?: number;
    limit?: number;
    category?: string;
    vertical?: string;
    country?: string;
    client_type?: string;
    status?: string;
    quarter?: string;
    min_score?: number;
    max_score?: number;
    min_roi?: number;
    max_roi?: number;
    search?: string;
  }): Promise<InitiativeListResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/kanban/initiatives${queryString ? `?${queryString}` : ''}`;
    
    return this.request<InitiativeListResponse>(endpoint);
  }

  async getInitiative(id: string): Promise<{ data: Initiative }> {
    return this.request<{ data: Initiative }>(`/kanban/initiatives/${id}`);
  }

  async createInitiative(initiative: Partial<Initiative>): Promise<{ message: string }> {
    return this.request<{ message: string }>('/kanban/initiatives', {
      method: 'POST',
      body: JSON.stringify(initiative),
    });
  }

  async updateInitiative(id: string, updates: Partial<Initiative>): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/kanban/initiatives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteInitiative(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/kanban/initiatives/${id}`, {
      method: 'DELETE',
    });
  }

  async getKanbanStatuses(): Promise<KanbanStatusesResponse> {
    return this.request<KanbanStatusesResponse>('/kanban/statuses');
  }

  async moveInitiative(id: string, moveRequest: KanbanMoveRequest): Promise<KanbanMoveResponse> {
    return this.request<KanbanMoveResponse>(`/kanban/initiatives/${id}/move`, {
      method: 'PUT',
      body: JSON.stringify(moveRequest),
    });
  }

  async getInitiativeStats(): Promise<InitiativeStatsResponse> {
    return this.request<InitiativeStatsResponse>('/kanban/stats');
  }

  // Dashboard endpoints
  async getDashboardStats(): Promise<{
    total_initiatives: number;
    draft_initiatives: number;
    in_review_initiatives: number;
    prioritized_initiatives: number;
  }> {
    return this.request('/dashboard/stats');
  }

  async getInitiativesByStatus(): Promise<Array<{ status: string; count: number }>> {
    return this.request('/dashboard/initiatives-by-status');
  }

  async getInitiativesByCategory(): Promise<Array<{ category: string; count: number }>> {
    return this.request('/dashboard/initiatives-by-category');
  }

  // Initiative detail endpoints
  async getInitiativeMessages(id: string): Promise<Array<any>> {
    return this.request(`/initiatives/${id}/messages`);
  }

  async addInitiativeMessage(id: string, message: { content: string; type: string }): Promise<any> {
    return this.request(`/initiatives/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  async getInitiativeSuggestions(id: string): Promise<Array<any>> {
    return this.request(`/initiatives/${id}/suggestions`);
  }

  async applySuggestion(id: string, suggestionId: string): Promise<any> {
    return this.request(`/initiatives/${id}/suggestions/apply`, {
      method: 'POST',
      body: JSON.stringify({ suggestion_id: suggestionId }),
    });
  }

  // Prod & IT endpoints
  async getProdItData(id: string): Promise<any> {
    return this.request(`/initiatives/${id}/prod-it`);
  }

  async updateProdItData(id: string, data: any): Promise<any> {
    return this.request(`/initiatives/${id}/prod-it`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createProdItData(id: string, data: any): Promise<any> {
    return this.request(`/initiatives/${id}/prod-it`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Agent endpoints
  async intakeIntervention(data: any): Promise<any> {
    return this.request('/agent/intake', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeIntake(data: any): Promise<any> {
    return this.request('/agent/intake/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async estimationIntervention(data: any): Promise<any> {
    return this.request('/agent/estimation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scoringIntervention(data: any): Promise<any> {
    return this.request('/agent/scoring', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Slack endpoints
  async getSlackUsers(): Promise<SlackUsersResponse> {
    return this.request<SlackUsersResponse>('/slack/users');
  }

  async sendSlackMessage(message: SlackMessageRequest): Promise<SlackMessageResponse> {
    return this.request<SlackMessageResponse>('/slack/send-message', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email?: string;
  is_bot: boolean;
}

export interface SlackUsersResponse {
  success: boolean;
  users?: SlackUser[];
  error?: string;
}

export interface SlackMessageRequest {
  channel: string;
  text: string;
}

export interface SlackMessageResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export const apiService = new ApiService();
