import { describe, expect, it } from 'vitest';

import { calculateShipping, FREE_SHIPPING_FROM, SHIPPING_COST } from './shipping';

describe('calculateShipping', () => {
    it('no cobra envío con el carrito vacío', () => {
        expect(calculateShipping(0)).toBe(0);
    });

    it('cobra el envío por debajo del mínimo', () => {
        expect(calculateShipping(FREE_SHIPPING_FROM - 1)).toBe(SHIPPING_COST);
    });

    it('da envío gratis desde el mínimo', () => {
        expect(calculateShipping(FREE_SHIPPING_FROM)).toBe(0);
    });
});
