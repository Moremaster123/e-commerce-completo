import { createSlice } from '@reduxjs/toolkit';

const orderSlice = createSlice({
    name: 'order',
    initialState: { lastOrder: null },
    reducers: {
        placeOrder: (state, action) => {
            state.lastOrder = action.payload;
        },
    },
});

export const { placeOrder } = orderSlice.actions;

export const selectLastOrder = (state) => state.order.lastOrder;

export default orderSlice.reducer;
