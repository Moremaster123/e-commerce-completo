import { configureStore } from '@reduxjs/toolkit';

import cartReducer from './cartSlice';
import authReducer from './authSlice';
import orderReducer from './orderSlice';
import { saveCart } from '../utils/cartStorage';

// Las pruebas crean su propio store con un estado inicial a la medida
export const setupStore = (preloadedState) =>
    configureStore({
        reducer: {
            cart: cartReducer,
            auth: authReducer,
            order: orderReducer,
        },
        preloadedState,
    });

export const store = setupStore();

store.subscribe(() => saveCart(store.getState().cart.items));
