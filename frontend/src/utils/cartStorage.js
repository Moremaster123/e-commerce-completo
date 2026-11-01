const CART_KEY = 'romxno_cart';

export const loadCart = () => {
    try {
        const items = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');

        return Array.isArray(items) ? items.filter((item) => item?.id && item.quantity > 0) : [];
    } catch {
        return [];
    }
};

export const saveCart = (items) => {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
        return;
    }
};
