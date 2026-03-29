import { api } from '../api/client';
import { ENDPOINTS } from '../api/endpoints';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const aiService = {
  stagger: () => delay(500),
  chat: (query: string, persona?: string) => api.post(ENDPOINTS.AI_CHAT, { query, persona }),
  getConfig: (persona?: string) => api.get(persona ? `${ENDPOINTS.AI_CONFIG}?persona=${persona}` : ENDPOINTS.AI_CONFIG),

  processQuery: (query: string, agentId?: string, persona?: string) => api.post<any>(ENDPOINTS.AI_CHAT, { query, agentId, persona }),

  magicFill: (text: string) => api.post(ENDPOINTS.AI_MAGIC_FILL, { text }),

  getInsights: (persona?: string) => api.get(persona ? `${ENDPOINTS.AI_INSIGHTS}?persona=${persona}` : ENDPOINTS.AI_INSIGHTS),
  getUsage: () => api.get(ENDPOINTS.AI_USAGE),

  predictRevenue: (historicalData: any[]) => api.post(ENDPOINTS.AI_PREDICT_REVENUE, { historicalData }),

  sendCommand: (command: string) => api.post(ENDPOINTS.AI_COMMAND, { command }),

  generateSettlementOffer: (id: string) => api.post(ENDPOINTS.AI_SETTLEMENT, { id }),

  // Helper for converting blob to base64 if needed for other AI tasks
  blobToBase64: (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};
