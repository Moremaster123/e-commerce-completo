export const PAYMENT_METHODS = [
    { id: 'card', label: 'Tarjeta de crédito o débito' },
    { id: 'transfer', label: 'Transferencia SPEI' },
    { id: 'cash', label: 'Pago en efectivo en OXXO' },
];

export const getPaymentLabel = (id) =>
    PAYMENT_METHODS.find((method) => method.id === id)?.label ?? '';

export const onlyDigits = (value) => value.replace(/\D/g, '');

