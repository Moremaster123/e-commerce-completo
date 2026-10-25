import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Cart from './Cart';
import { renderWithProviders, sampleProduct } from '../test/renderWithProviders';

const withOneItem = { cart: { items: [{ ...sampleProduct, quantity: 1 }] } };

describe('Cart', () => {
    it('muestra el mensaje de carrito vacío', () => {
        renderWithProviders(<Cart />);

        expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });

    it('muestra el envío y el total del pedido', () => {
        renderWithProviders(<Cart />, { preloadedState: withOneItem });

        expect(screen.getByText('$59.00')).toBeInTheDocument();
        expect(screen.getByText('$158.00')).toBeInTheDocument();
    });

    it('aumenta la cantidad de un producto', async () => {
        const user = userEvent.setup();
        const { store } = renderWithProviders(<Cart />, { preloadedState: withOneItem });

        await user.click(screen.getByRole('button', { name: 'Aumentar cantidad de Tinta Negra' }));

        expect(store.getState().cart.items[0].quantity).toBe(2);
        expect(screen.getByLabelText('Cantidad de Tinta Negra')).toHaveTextContent('2');
    });

    it('quita un producto del carrito', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Cart />, { preloadedState: withOneItem });

        await user.click(screen.getByRole('button', { name: 'Quitar Tinta Negra del carrito' }));

        expect(screen.getByText('Tu carrito está vacío')).toBeInTheDocument();
    });
});
