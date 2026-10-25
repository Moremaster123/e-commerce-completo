import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ProductCard from './ProductCard';
import { renderWithProviders, sampleProduct } from '../test/renderWithProviders';

describe('ProductCard', () => {
    it('muestra los datos del producto', () => {
        renderWithProviders(<ProductCard product={sampleProduct} />);

        expect(screen.getByRole('heading', { name: 'Tinta Negra' })).toBeInTheDocument();
        expect(screen.getByText('Anime y manga')).toBeInTheDocument();
        expect(screen.getByText('$99.00')).toBeInTheDocument();
        expect(screen.getByAltText('Llavero Tinta Negra')).toBeInTheDocument();
    });

    it('agrega el producto al carrito', async () => {
        const user = userEvent.setup();
        const { store } = renderWithProviders(<ProductCard product={sampleProduct} />);

        await user.click(screen.getByRole('button', { name: 'Agregar Tinta Negra al carrito' }));

        expect(store.getState().cart.items).toEqual([{ ...sampleProduct, quantity: 1 }]);
    });
});
