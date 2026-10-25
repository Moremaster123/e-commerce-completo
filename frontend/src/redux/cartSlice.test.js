import { describe, expect, it } from 'vitest';

import reducer, {
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    selectCartCount,
    selectCartTotal,
} from './cartSlice';

const product = { id: 1, name: 'Tinta Negra', price: 99 };
const other = { id: 2, name: 'Racing Rojo', price: 119 };

describe('cartSlice', () => {
    it('agrega un producto nuevo con cantidad 1', () => {
        const state = reducer(undefined, addToCart(product));

        expect(state.items).toEqual([{ ...product, quantity: 1 }]);
    });

    it('aumenta la cantidad si el producto ya está en el carrito', () => {
        let state = reducer(undefined, addToCart(product));
        state = reducer(state, addToCart(product));

        expect(state.items).toHaveLength(1);
        expect(state.items[0].quantity).toBe(2);
    });

    it('aumenta y disminuye la cantidad', () => {
        let state = reducer(undefined, addToCart(product));
        state = reducer(state, increaseQuantity(1));
        expect(state.items[0].quantity).toBe(2);

        state = reducer(state, decreaseQuantity(1));
        expect(state.items[0].quantity).toBe(1);
    });

    it('quita el producto al disminuir desde 1', () => {
        let state = reducer(undefined, addToCart(product));
        state = reducer(state, decreaseQuantity(1));

        expect(state.items).toEqual([]);
    });

    it('quita un producto y vacía el carrito', () => {
        let state = reducer(undefined, addToCart(product));
        state = reducer(state, addToCart(other));

        state = reducer(state, removeFromCart(1));
        expect(state.items.map((item) => item.id)).toEqual([2]);

        state = reducer(state, clearCart());
        expect(state.items).toEqual([]);
    });

    it('calcula la cantidad y el total', () => {
        const state = {
            cart: {
                items: [
                    { ...product, quantity: 2 },
                    { ...other, quantity: 1 },
                ],
            },
        };

        expect(selectCartCount(state)).toBe(3);
        expect(selectCartTotal(state)).toBe(317);
    });
});
