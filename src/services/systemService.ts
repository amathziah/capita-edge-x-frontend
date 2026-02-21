import { api } from '../api/client';

export const systemService = {
    getDbVolume: () => api.get('/system/db-volume'),
    runStressTest: (config: { productsCount: number, customersCount: number, invoicesCount: number }) =>
        api.post('/system/stress-test', config)
};
