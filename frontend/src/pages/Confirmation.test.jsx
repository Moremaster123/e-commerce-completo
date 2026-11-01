import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';

import Confirmation from './Confirmation';
import api from '../api/client';
import { apiError } from '../api/__mocks__/client';
import { renderWithProviders, sampleUser } from '../test/renderWithProviders';

const order = (changes = {}) => ({
    id: 'RX-1',
    date: '2026-11-01T12:00:00Z',
    status: 'Pendiente de pago',
    statusCode: 'pending',
    paymentStatus: null,
    checkoutUrl: 'https://mercadopago.test/pagar',
    customer: sampleUser,
    items: [{ id: 1, name: 'Tinta Negra', price: 99, quantity: 2 }],
    subtotal: 198,
    shipping: 59,
    total: 257,
    address: {
        fullName: 'Ana López', street: 'Reforma 10', neighborhood: 'Centro',
        city: 'Puebla', state: 'Puebla', zip: '72000', phone: '2221234567',
    },
    payment: { method: 'mercadopago', label: 'Mercado Pago', last4: null },
    ...changes,
});

const renderAt = (route) => renderWithProviders(<Confirmation />, { route, preloadedState: { auth: { user: sampleUser } } });

describe('Confirmation', () => {
    it('confirma el pago cuando Mercado Pago regresa con payment_id', async () => {
        api.post.mockResolvedValue({ data: order({ statusCode: 'paid', paymentStatus: 'approved', checkoutUrl: null }) });

        renderAt('/confirmacion?pedido=RX-1&payment_id=555&status=approved');

        expect(await screen.findByText('¡Gracias por tu compra, Ana!')).toBeInTheDocument();
        expect(api.post).toHaveBeenCalledWith('/orders/RX-1/pago/', { payment_id: '555' });
        expect(screen.getByText('Total pagado')).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Pagar/ })).not.toBeInTheDocument();
    });

    it('permite reintentar cuando el pago fue rechazado', async () => {
        api.post.mockResolvedValue({ data: order({ paymentStatus: 'rejected' }) });

        renderAt('/confirmacion?pedido=RX-1&payment_id=555&status=rejected');

        expect(await screen.findByText('Tu pago fue rechazado')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Intentar pagar de nuevo' })).toHaveAttribute(
            'href',
            'https://mercadopago.test/pagar'
        );
    });

    it('explica el pago pendiente de OXXO o SPEI', async () => {
        api.post.mockResolvedValue({ data: order({ paymentStatus: 'pending' }) });

        renderAt('/confirmacion?pedido=RX-1&collection_id=555&status=pending');

        expect(await screen.findByText('Tu pago está en proceso')).toBeInTheDocument();
        expect(api.post).toHaveBeenCalledWith('/orders/RX-1/pago/', { payment_id: '555' });
    });

    it('consulta el pedido si el cliente regresó sin pagar', async () => {
        api.get.mockResolvedValue({ data: order() });

        renderAt('/confirmacion?pedido=RX-1&payment_id=null');

        expect(await screen.findByText('Tu pedido está esperando el pago')).toBeInTheDocument();
        expect(api.get).toHaveBeenCalledWith('/orders/RX-1/');
        expect(screen.getByRole('link', { name: 'Pagar con Mercado Pago' })).toBeInTheDocument();
    });

    it('avisa si no se pudo consultar el pedido', async () => {
        api.get.mockRejectedValue(apiError(404, { detail: 'No encontrado.' }));

        renderAt('/confirmacion?pedido=RX-9');

        expect(await screen.findByText('No pudimos consultar tu pedido')).toBeInTheDocument();
        expect(screen.getByText('No encontrado.')).toBeInTheDocument();
    });
});
