import { describe, expect, it } from 'vitest';

import {
    isValidEmail,
    validateLogin,
    validateRegister,
    validateAddress,
    validatePayment,
} from './validators';

const validAddress = {
    fullName: 'Ana López',
    street: 'Reforma 10',
    neighborhood: 'Centro',
    city: 'Puebla',
    state: 'Puebla',
    zip: '72000',
    phone: '222 123 4567',
};

describe('isValidEmail', () => {
    it('acepta un correo bien formado', () => {
        expect(isValidEmail('ana@correo.com')).toBe(true);
    });

    it('rechaza un correo incompleto', () => {
        expect(isValidEmail('hola@')).toBe(false);
    });
});

describe('validateLogin', () => {
    it('marca los campos vacíos', () => {
        expect(validateLogin({ email: '', password: '' })).toEqual({
            email: 'Escribe tu correo electrónico.',
            password: 'Escribe tu contraseña.',
        });
    });

    it('no devuelve errores con datos válidos', () => {
        expect(validateLogin({ email: 'ana@correo.com', password: 'secreto' })).toEqual({});
    });
});

describe('validateRegister', () => {
    const valid = {
        name: 'Ana',
        email: 'ana@correo.com',
        password: 'secreto',
        confirmPassword: 'secreto',
    };

    it('no devuelve errores con datos válidos', () => {
        expect(validateRegister(valid)).toEqual({});
    });

    it('exige una contraseña de al menos 6 caracteres', () => {
        const errors = validateRegister({ ...valid, password: '123', confirmPassword: '123' });

        expect(errors.password).toBe('La contraseña debe tener al menos 6 caracteres.');
    });

    it('detecta contraseñas que no coinciden', () => {
        const errors = validateRegister({ ...valid, confirmPassword: 'otra' });

        expect(errors.confirmPassword).toBe('Las contraseñas no coinciden.');
    });
});

describe('validateAddress', () => {
    it('no devuelve errores con una dirección completa', () => {
        expect(validateAddress(validAddress)).toEqual({});
    });

    it('valida el código postal y el teléfono', () => {
        const errors = validateAddress({ ...validAddress, zip: '72', phone: '123' });

        expect(errors.zip).toBe('El código postal debe tener 5 dígitos.');
        expect(errors.phone).toBe('El teléfono debe tener 10 dígitos.');
    });
});

describe('validatePayment', () => {
    it('no pide datos de tarjeta para otros métodos', () => {
        expect(validatePayment({ paymentMethod: 'transfer' })).toEqual({});
    });

    it('valida los datos de la tarjeta', () => {
        const errors = validatePayment({
            paymentMethod: 'card',
            cardNumber: '1234',
            cardExpiry: '13/28',
            cardCvv: '1',
        });

        expect(Object.keys(errors)).toEqual(['cardNumber', 'cardExpiry', 'cardCvv']);
    });

    it('acepta una tarjeta con espacios en el número', () => {
        const errors = validatePayment({
            paymentMethod: 'card',
            cardNumber: '4242 4242 4242 4242',
            cardExpiry: '12/28',
            cardCvv: '123',
        });

        expect(errors).toEqual({});
    });
});
