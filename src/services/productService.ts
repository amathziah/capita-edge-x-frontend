import { api } from '../api/client';
import { Product } from '../types';

export const productService = {
    getProducts: () => api.get<Product[]>('/products'),

    saveProduct: (product: Product) => api.post<{ id: string }>('/products', product),

    updateProduct: (id: string, product: Partial<Product>) => api.post<void>('/products', { ...product, id }),

    deleteProduct: (id: string) => api.delete<void>(`/products/${id}`)
};
