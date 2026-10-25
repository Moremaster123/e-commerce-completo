import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Login from './Login';
import api from '../api/client';
import { apiError } from '../api/__mocks__/client';
import { loadSession } from '../utils/users';
import { renderWithProviders } from '../test/renderWithProviders';

const fillForm = async (user, password) => {
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), password);
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));
};

describe('Login', () => {
    it('muestra los errores al enviar el formulario vacío', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await user.click(screen.getByRole('button', { name: 'Ingresar' }));

        expect(screen.getByText('Escribe tu correo electrónico.')).toBeInTheDocument();
        expect(screen.getByText('Escribe tu contraseña.')).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('avisa cuando el backend rechaza las credenciales', async () => {
        api.post.mockRejectedValue(apiError(400, { non_field_errors: ['Correo o contraseña incorrectos.'] }));

        const user = userEvent.setup();
        const { store } = renderWithProviders(<Login />);

        await fillForm(user, 'incorrecta');

        expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument();
        expect(store.getState().auth.user).toBeNull();
    });

    it('avisa cuando no hay conexión con el backend', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Login />);

        await fillForm(user, 'secreto');

        expect(
            await screen.findByText('No pudimos conectar con la tienda. Revisa tu conexión e intenta de nuevo.')
        ).toBeInTheDocument();
    });

    it('inicia sesión con el token que devuelve el backend', async () => {
        api.post.mockResolvedValue({
            data: { token: 'abc123', user: { name: 'Ana López', email: 'ana@correo.com' } },
        });

        const user = userEvent.setup();
        const { store } = renderWithProviders(<Login />);

        await fillForm(user, 'secreto');

        await waitFor(() =>
            expect(store.getState().auth.user).toEqual({ name: 'Ana López', email: 'ana@correo.com' })
        );
        expect(api.post).toHaveBeenCalledWith('/accounts/login/', { email: 'ana@correo.com', password: 'secreto' });
        expect(loadSession().token).toBe('abc123');
    });

    it('muestra el aviso cuando se llega desde el checkout', () => {
        renderWithProviders(<Login />, { route: { pathname: '/login', state: { from: '/checkout' } } });

        expect(
            screen.getByText('Inicia sesión o crea una cuenta para continuar con tu compra.')
        ).toBeInTheDocument();
    });
});
