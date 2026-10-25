import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Register from './Register';
import api from '../api/client';
import { apiError } from '../api/__mocks__/client';
import { renderWithProviders } from '../test/renderWithProviders';

const fillForm = async (user, { password = 'secreto', confirmPassword = 'secreto' } = {}) => {
    await user.type(screen.getByLabelText('Nombre'), 'Ana López');
    await user.type(screen.getByLabelText('Correo electrónico'), 'ana@correo.com');
    await user.type(screen.getByLabelText('Contraseña'), password);
    await user.type(screen.getByLabelText('Confirmar contraseña'), confirmPassword);
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));
};

describe('Register', () => {
    it('avisa cuando las contraseñas no coinciden', async () => {
        const user = userEvent.setup();
        const { store } = renderWithProviders(<Register />);

        await fillForm(user, { confirmPassword: 'distinta' });

        expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
        expect(store.getState().auth.user).toBeNull();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('crea la cuenta en el backend e inicia la sesión', async () => {
        api.post.mockResolvedValue({
            data: { token: 'abc123', user: { name: 'Ana López', email: 'ana@correo.com' } },
        });

        const user = userEvent.setup();
        const { store } = renderWithProviders(<Register />);

        await fillForm(user);

        await waitFor(() =>
            expect(store.getState().auth.user).toEqual({ name: 'Ana López', email: 'ana@correo.com' })
        );
        expect(api.post).toHaveBeenCalledWith('/accounts/register/', {
            name: 'Ana López',
            email: 'ana@correo.com',
            password: 'secreto',
        });
    });

    it('muestra el error del backend cuando el correo ya tiene cuenta', async () => {
        api.post.mockRejectedValue(apiError(400, { email: ['Ya existe una cuenta con ese correo.'] }));

        const user = userEvent.setup();
        renderWithProviders(<Register />);

        await fillForm(user);

        expect(await screen.findByText('Ya existe una cuenta con ese correo.')).toBeInTheDocument();
    });
});
