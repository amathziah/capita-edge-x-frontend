import { api } from '../api/client';

export const aiService = {
  chat: (query: string) => api.post('/ai/chat', { query }),

  magicFill: (text: string) => api.post('/ai/magic-fill', { text }),

  getInsights: () => api.get('/ai/insights'),

  predictRevenue: (historicalData: any[]) => api.post('/ai/predict-revenue', { historicalData }),

  sendCommand: (command: string) => api.post('/ai/command', { command }),

  generateSettlementOffer: (id: string) => api.post('/ai/settlement', { id }), // Can also use legacy /negotiate-settlement

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
