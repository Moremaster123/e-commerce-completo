import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Header from './Header';
import { renderWithProviders, sampleProduct, sampleUser } from '../test/renderWithProviders';

describe('Header', () => {
    it('muestra los enlaces de cuenta cuando no hay sesión', () => {
        renderWithProviders(<Header />);

        expect(screen.getByRole('link', { name: 'Ingresar' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Crear cuenta' })).toBeInTheDocument();
    });

    it('muestra la cantidad de productos del carrito', () => {
        renderWithProviders(<Header />, {
            preloadedState: { cart: { items: [{ ...sampleProduct, quantity: 3 }] } },
        });

        expect(screen.getByRole('link', { name: /Carrito/ })).toHaveTextContent('3');
    });

    it('saluda al usuario y permite cerrar sesión', async () => {
        const user = userEvent.setup();
        const { store } = renderWithProviders(<Header />, {
            preloadedState: { auth: { user: sampleUser } },
        });

        expect(screen.getByText('Hola, Ana')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Salir' }));

        expect(store.getState().auth.user).toBeNull();
        expect(screen.getByRole('link', { name: 'Ingresar' })).toBeInTheDocument();
    });
});
