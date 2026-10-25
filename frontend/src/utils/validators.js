import { onlyDigits } from './payment';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/;

export const isValidEmail = (email) => EMAIL_REGEX.test(email.trim());

const validateEmail = (email) => {
    if (!email.trim()) {
        return 'Escribe tu correo electrónico.';
    }

    if (!isValidEmail(email)) {
        return 'El correo no tiene un formato válido.';
    }

    return '';
};

export const validateLogin = ({ email, password }) => {
    const errors = {};

    const emailError = validateEmail(email);

    if (emailError) {
        errors.email = emailError;
    }

    if (!password) {
        errors.password = 'Escribe tu contraseña.';
    }

    return errors;
};

export const validateRegister = ({ name, email, password, confirmPassword }) => {
    const errors = {};

    if (name.trim().length < 2) {
        errors.name = 'Escribe tu nombre (mínimo 2 letras).';
    }

    const emailError = validateEmail(email);

    if (emailError) {
        errors.email = emailError;
    }

    if (password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (!confirmPassword) {
        errors.confirmPassword = 'Confirma tu contraseña.';
    } else if (confirmPassword !== password) {
        errors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return errors;
};

export const validateAddress = (values) => {
    const errors = {};

    if (values.fullName.trim().length < 3) {
        errors.fullName = 'Escribe el nombre de quien recibe.';
    }

    if (!values.street.trim()) {
        errors.street = 'Escribe la calle y el número.';
    }

    if (!values.neighborhood.trim()) {
        errors.neighborhood = 'Escribe la colonia.';
    }

    if (!values.city.trim()) {
        errors.city = 'Escribe la ciudad.';
    }

    if (!values.state.trim()) {
        errors.state = 'Escribe el estado.';
    }

    if (!/^\d{5}$/.test(values.zip.trim())) {
        errors.zip = 'El código postal debe tener 5 dígitos.';
    }

    if (onlyDigits(values.phone).length !== 10) {
        errors.phone = 'El teléfono debe tener 10 dígitos.';
    }

    return errors;
};

export const validatePayment = (values) => {
    const errors = {};

    if (!values.paymentMethod) {
        errors.paymentMethod = 'Elige un método de pago.';
    }

    if (values.paymentMethod === 'card') {
        if (onlyDigits(values.cardNumber).length !== 16) {
            errors.cardNumber = 'El número de tarjeta debe tener 16 dígitos.';
        }

        if (!EXPIRY_REGEX.test(values.cardExpiry.trim())) {
            errors.cardExpiry = 'Usa el formato MM/AA.';
        }

        if (!/^\d{3,4}$/.test(values.cardCvv.trim())) {
            errors.cardCvv = 'El CVV debe tener 3 o 4 dígitos.';
        }
    }

    return errors;
};
