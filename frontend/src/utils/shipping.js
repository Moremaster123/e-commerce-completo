export const FREE_SHIPPING_FROM = 499;
export const SHIPPING_COST = 59;

export const calculateShipping = (subtotal) =>
    subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_COST;