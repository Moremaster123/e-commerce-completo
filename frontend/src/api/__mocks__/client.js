import { vi } from 'vitest';

const api = {
    get: vi.fn(),
    post: vi.fn(),
};

export const resetApiMock = () => {
    api.get.mockReset().mockResolvedValue({ data: [] });
    api.post.mockReset().mockRejectedValue(new Error('Sin respuesta simulada'));
};

export const apiError = (status, data) => Object.assign(new Error('Error de la API'), { response: { status, data } });

export default api;
