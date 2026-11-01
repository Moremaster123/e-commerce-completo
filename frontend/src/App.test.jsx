import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';
import api from './api/client';
import { apiError } from './api/__mocks__/client';
import { renderWithProviders, sampleProduct, sampleUser } from './test/renderWithProviders';

const serverOrder = {
    id: 'RX-ABC123',
    date: '2026-10-24T19:00:00-06:00',
    status: 'Pagada',
    statusCode: 'paid',
    paymentStatus: 'approved',
    checkoutUrl: null,
    customer: sampleUser,
    items: [{ id: 1, name: 'Tinta Negra', price: 99, quantity: 2 }],
    subtotal: 198,
    shipping: 59,
    total: 257,
    address: {
        id: 1,
        fullName: 'Ana López',
        street: 'Reforma 10',
        neighborhood: 'Centro',
        city: 'Puebla',
        state: 'Puebla',
        zip: '72000',
        phone: '2221234567',
    },
    payment: { id: 1, method: 'mercadopago', label: 'Mercado Pago', last4: null },
};

const readyToPay = {
    auth: { user: sampleUser },
    cart: { items: [{ ...sampleProduct, quantity: 2 }] },
};

const fillAddress = async (user) => {
    await user.type(screen.getByLabelText('Calle y número'), 'Reforma 10');
    await user.type(screen.getByLabelText('Colonia'), 'Centro');
    await user.type(screen.getByLabelText('Código postal'), '72000');
    await user.type(screen.getByLabelText('Ciudad'), 'Puebla');
    await user.type(screen.getByLabelText('Estado'), 'Puebla');
    await user.type(screen.getByLabelText('Teléfono (10 dígitos)'), '2221234567');
};

describe('App', () => {
    it('muestra el catálogo en el inicio', () => {
        renderWithProviders(<App />);

        expect(screen.getByRole('heading', { name: 'Nuestros llaveros' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Sobre ROMXNO' })).toBeInTheDocument();
    });

    it('carga los productos desde el backend', async () => {
        api.get.mockResolvedValue({
            data: [{ id: 7, name: 'Aqua Manga', category: 'Anime y manga', price: 109, image: 'llavero-07.jpeg', description: 'Turquesa' }],
        });

        renderWithProviders(<App />);

        expect(screen.getByText('Cargando llaveros...')).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Aqua Manga' })).toBeInTheDocument();
        expect(screen.getByAltText('Llavero Aqua Manga')).toHaveAttribute('src', '/images/llavero-07.jpeg');
        expect(api.get).toHaveBeenCalledWith('/products/', { params: {} });
    });

    it('filtra por categoría pidiendo los datos al backend', async () => {
        const user = userEvent.setup();
        renderWithProviders(<App />);

        await user.click(screen.getByRole('button', { name: 'Streetwear' }));

        expect(api.get).toHaveBeenLastCalledWith('/products/', { params: { category: 'Streetwear' } });
    });

    it('muestra el catálogo guardado si el backend no responde', async () => {
        api.get.mockRejectedValue(new Error('Network Error'));

        renderWithProviders(<App />);

        expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos conectar con la tienda.');
        expect(screen.getByRole('heading', { name: 'Tinta Negra' })).toBeInTheDocument();
    });

    it('manda al login si se entra al checkout sin sesión', () => {
        renderWithProviders(<App />, { route: '/checkout' });

        expect(screen.getByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
        expect(
            screen.getByText('Inicia sesión o crea una cuenta para continuar con tu compra.')
        ).toBeInTheDocument();
    });

    it('no deja ir a pagar sin la dirección de envío', async () => {
        const user = userEvent.setup();
        renderWithProviders(<App />, { route: '/checkout', preloadedState: readyToPay });

        await user.click(screen.getByRole('button', { name: /con Mercado Pago/ }));

        expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('crea el pedido en el backend y muestra la confirmación', async () => {
        api.post.mockResolvedValue({ data: serverOrder });
        api.get.mockResolvedValue({ data: serverOrder });

        const user = userEvent.setup();
        const { store } = renderWithProviders(<App />, { route: '/checkout', preloadedState: readyToPay });

        await fillAddress(user);
        await user.click(screen.getByRole('button', { name: /con Mercado Pago/ }));

        expect(await screen.findByRole('heading', { name: '¡Gracias por tu compra, Ana!' })).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith('/orders/RX-ABC123/');
        expect(screen.getByText('RX-ABC123')).toBeInTheDocument();
        expect(screen.getByText('Reforma 10, Centro')).toBeInTheDocument();
        expect(screen.getByText('Mercado Pago')).toBeInTheDocument();
        expect(store.getState().cart.items).toEqual([]);
        expect(api.post).toHaveBeenCalledWith('/orders/', {
            items: [{ product: 1, quantity: 2 }],
            address: {
                fullName: 'Ana López',
                street: 'Reforma 10',
                neighborhood: 'Centro',
                city: 'Puebla',
                state: 'Puebla',
                zip: '72000',
                phone: '2221234567',
            },
            payment: { method: 'mercadopago' },
        });
    });

    it('muestra el error del backend y conserva el carrito', async () => {
        api.post.mockRejectedValue(apiError(400, { items: ['No hay suficiente stock de Tinta Negra.'] }));

        const user = userEvent.setup();
        const { store } = renderWithProviders(<App />, { route: '/checkout', preloadedState: readyToPay });

        await fillAddress(user);
        await user.click(screen.getByRole('button', { name: /con Mercado Pago/ }));

        expect(await screen.findByText('No hay suficiente stock de Tinta Negra.')).toBeInTheDocument();
        expect(store.getState().cart.items).toHaveLength(1);
    });

    it('pide iniciar sesión para ver la confirmación', () => {
        renderWithProviders(<App />, { route: '/confirmacion?pedido=RX-ABC123' });

        expect(screen.getByRole('heading', { name: 'Ingresar' })).toBeInTheDocument();
    });
});
