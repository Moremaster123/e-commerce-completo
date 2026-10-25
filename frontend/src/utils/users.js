const SESSION_KEY = 'romxno_session';

const read = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);

        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
};

const write = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        return;
    }
};

export const publicUser = ({ name, email }) => ({ name, email });

export const loadSession = () => {
    const session = read(SESSION_KEY, null);

    return session && session.email && session.token ? session : null;
};

export const saveSession = (user, token) => write(SESSION_KEY, { ...publicUser(user), token });

export const clearSession = () => {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch {
        return;
    }
};
