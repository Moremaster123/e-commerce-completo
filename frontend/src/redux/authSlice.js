import { createSlice } from '@reduxjs/toolkit';

import api from '../api/client';
import { getErrorMessage } from '../api/errors';
import { loadSession, saveSession, clearSession, publicUser } from '../utils/users';

const session = loadSession();

const authSlice = createSlice({
    name: 'auth',
    initialState: { user: session ? publicUser(session) : null },
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload;
        },
        clearUser: (state) => {
            state.user = null;
        },
    },
});

export const { setUser, clearUser } = authSlice.actions;

const startSession = async (dispatch, request) => {
    try {
        const { data } = await request;

        saveSession(data.user, data.token);
        dispatch(setUser(publicUser(data.user)));

        return { ok: true };
    } catch (error) {
        return { ok: false, error: getErrorMessage(error) };
    }
};

export const login = (email, password) => (dispatch) =>
    startSession(dispatch, api.post('/accounts/login/', { email: email.trim(), password }));

export const register = ({ name, email, password }) => (dispatch) =>
    startSession(dispatch, api.post('/accounts/register/', { name: name.trim(), email: email.trim(), password }));

export const logout = () => async (dispatch) => {
    await api.post('/accounts/logout/').catch(() => null);
    clearSession();
    dispatch(clearUser());
};

export const selectUser = (state) => state.auth.user;

export default authSlice.reducer;
