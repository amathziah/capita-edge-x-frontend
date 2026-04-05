import { api } from '@/shared/api/client';
import { ENDPOINTS } from '@/shared/api/endpoints';
import { Product } from '@/types';

export const productService = {
    getProducts: () => api.get<Product[]>(ENDPOINTS.PRODUCTS),

    saveProduct: (product: Product) => api.post<{ id: string }>(ENDPOINTS.PRODUCTS, product),

    updateProduct: (id: string, product: Partial<Product>) => api.post<void>(ENDPOINTS.PRODUCTS, { ...product, id }),

    deleteProduct: (id: string) => api.delete<void>(ENDPOINTS.PRODUCT(id))
};
