const UNEXPECTED_ERROR = 'Ocurrió un error inesperado. Intenta de nuevo.';

export const CONNECTION_ERROR = 'No pudimos conectar con la tienda. Revisa tu conexión e intenta de nuevo.';

const firstMessage = (value) => {
    if (typeof value === 'string') {
        return value;
    }

    const values = Array.isArray(value) ? value : Object.values(value ?? {});

    for (const item of values) {
        const message = firstMessage(item);

        if (message) {
            return message;
        }
    }

    return '';
};

export const getErrorMessage = (error, fallback = CONNECTION_ERROR) => {
    if (!error?.response) {
        return fallback;
    }

    if (typeof error.response.data !== 'object') {
        return UNEXPECTED_ERROR;
    }

    return firstMessage(error.response.data) || UNEXPECTED_ERROR;
};
