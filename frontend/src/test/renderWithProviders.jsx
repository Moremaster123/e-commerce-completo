import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';

import { setupStore } from '../redux/store';
import { theme } from '../styles/theme';

export const sampleProduct = {
    id: 1,
    name: 'Tinta Negra',
    category: 'Anime y manga',
    price: 99,
    image: '/images/llavero-01.jpeg',
    description: 'Llavero de tela tejida con ilustración manga.',
};

export const sampleUser = { name: 'Ana López', email: 'ana@correo.com' };

export function renderWithProviders(ui, { preloadedState, route = '/' } = {}) {
    const store = setupStore(preloadedState);

    const view = render(
        <Provider store={store}>
            <ThemeProvider theme={theme}>
                <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </ThemeProvider>
        </Provider>
    );

    return { store, ...view };
}
