import { describe, expect, it } from 'vitest';

import { loadCart, saveCart } from './cartStorage';

describe('cartStorage', () => {
    it('guarda y recupera el carrito', () => {
        saveCart([{ id: 1, name: 'Tinta Negra', price: 99, quantity: 2 }]);

        expect(loadCart()).toEqual([{ id: 1, name: 'Tinta Negra', price: 99, quantity: 2 }]);
    });

    it('regresa un carrito vacío si no hay nada guardado', () => {
        expect(loadCart()).toEqual([]);
    });

    it('ignora datos dañados', () => {
        localStorage.setItem('romxno_cart', '{no es json');
        expect(loadCart()).toEqual([]);

        localStorage.setItem('romxno_cart', JSON.stringify([{ id: 1, quantity: 0 }, null, { id: 2, quantity: 1 }]));
        expect(loadCart()).toEqual([{ id: 2, quantity: 1 }]);
    });
});
