class SlackService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  }

  async sendMessage(channel: string, text: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/slack/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel,
          text,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send Slack message');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending Slack message:', error);
      throw error;
    }
  }

  async getUsers(): Promise<{ success: boolean; users?: any[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/slack/users`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch Slack users');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching Slack users:', error);
      throw error;
    }
  }
}

export const slackService = new SlackService();
