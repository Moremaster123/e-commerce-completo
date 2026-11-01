import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Checkout from './Checkout';
import api from '../api/client';
import { apiError } from '../api/__mocks__/client';
import { redirectTo } from '../utils/redirect';
import { renderWithProviders, sampleProduct, sampleUser } from '../test/renderWithProviders';

vi.mock('../utils/redirect', () => ({ redirectTo: vi.fn() }));

const preloadedState = {
    cart: { items: [{ ...sampleProduct, quantity: 2 }] },
    auth: { user: sampleUser },
};

const fillAddress = async (user) => {
    await user.type(screen.getByLabelText('Calle y número'), 'Reforma 10');
    await user.type(screen.getByLabelText('Colonia'), 'Centro');
    await user.type(screen.getByLabelText('Código postal'), '72000');
    await user.type(screen.getByLabelText('Ciudad'), 'Puebla');
    await user.type(screen.getByLabelText('Estado'), 'Puebla');
    await user.type(screen.getByLabelText('Teléfono (10 dígitos)'), '2221234567');
};

const payButton = () => screen.getByRole('button', { name: 'Pagar $257.00 con Mercado Pago' });

describe('Checkout', () => {
    it('ya no pide datos de tarjeta', () => {
        renderWithProviders(<Checkout />, { preloadedState });

        expect(screen.queryByLabelText('Número de tarjeta')).not.toBeInTheDocument();
        expect(screen.getByText(/OXXO o por transferencia SPEI/)).toBeInTheDocument();
    });

    it('valida la dirección antes de ir a pagar', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Checkout />, { preloadedState });

        await user.click(payButton());

        expect(screen.getByText('Revisa los campos marcados en rojo.')).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('crea el pedido y manda al cliente a Mercado Pago', async () => {
        api.post.mockResolvedValue({
            data: { id: 'RX-1', statusCode: 'pending', checkoutUrl: 'https://mercadopago.test/pagar' },
        });

        const user = userEvent.setup();
        const { store } = renderWithProviders(<Checkout />, { preloadedState });

        await fillAddress(user);
        await user.click(payButton());

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
        expect(redirectTo).toHaveBeenCalledWith('https://mercadopago.test/pagar');
        expect(store.getState().cart.items).toEqual([]);
    });

    it('muestra el error si no se pudo iniciar el pago', async () => {
        api.post.mockRejectedValue(apiError(503, { detail: 'No pudimos iniciar el pago con Mercado Pago.' }));

        const user = userEvent.setup();
        const { store } = renderWithProviders(<Checkout />, { preloadedState });

        await fillAddress(user);
        await user.click(payButton());

        expect(await screen.findByText('No pudimos iniciar el pago con Mercado Pago.')).toBeInTheDocument();
        expect(store.getState().cart.items).toHaveLength(1);
        expect(payButton()).toBeEnabled();
    });
});
