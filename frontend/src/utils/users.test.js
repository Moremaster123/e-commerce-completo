import { describe, expect, it } from 'vitest';

import { saveSession, loadSession, clearSession, publicUser } from './users';

describe('users', () => {
    it('guarda la sesión con el token del servidor', () => {
        saveSession({ name: 'Ana López', email: 'ana@correo.com', password: 'no-se-guarda' }, 'abc123');

        expect(loadSession()).toEqual({ name: 'Ana López', email: 'ana@correo.com', token: 'abc123' });
    });

    it('ignora una sesión sin token', () => {
        localStorage.setItem('romxno_session', JSON.stringify({ name: 'Ana', email: 'ana@correo.com' }));

        expect(loadSession()).toBeNull();
    });

    it('limpia la sesión', () => {
        saveSession({ name: 'Ana López', email: 'ana@correo.com' }, 'abc123');
        clearSession();

        expect(loadSession()).toBeNull();
    });

    it('solo expone el nombre y el correo', () => {
        expect(publicUser({ name: 'Ana', email: 'ana@correo.com', token: 'x' })).toEqual({
            name: 'Ana',
            email: 'ana@correo.com',
        });
    });
});
