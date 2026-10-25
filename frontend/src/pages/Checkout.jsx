import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCartItems, selectCartTotal, clearCart } from '../redux/cartSlice';
import { selectUser } from '../redux/authSlice';
import { placeOrder } from '../redux/orderSlice';
import { formatPrice } from '../utils/formatPrice';
import { calculateShipping } from '../utils/shipping';
import { validateAddress, validatePayment } from '../utils/validators';
import { PAYMENT_METHODS, getPaymentLabel, onlyDigits } from '../utils/payment';
import api from '../api/client';
import { getErrorMessage } from '../api/errors';
import { Field, FormCard, FormError, FormNotice, SubmitButton } from '../components/FormElements';

const Page = styled.main`
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.25rem 3rem;
`;

const Title = styled.h1`
    margin: 0 0 1.5rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const Layout = styled.div`
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;
    align-items: start;

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
        grid-template-columns: 1fr;
    }
`;

const SectionTitle = styled.h2`
    margin: 0;
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const FieldRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

const PaymentGroup = styled.fieldset`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin: 0;
    padding: 0;
    border: none;
`;

const PaymentOption = styled.label`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.7rem 0.8rem;
    border: 2px solid ${({ $selected, theme }) => ($selected ? theme.colors.primary : theme.colors.border)};
    border-radius: 8px;
    cursor: pointer;
`;

const ErrorText = styled.span`
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.danger};
`;

const SecondaryButton = styled.button`
    align-self: flex-start;
    padding: 0.6rem 1.1rem;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    border-radius: 8px;
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.primary};
        color: #fff;
    }
`;

const SavedPayment = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.8rem 0.9rem;
    border: 1px solid ${({ theme }) => theme.colors.success};
    border-radius: 8px;
    background: #edf7ee;

    p {
        margin: 0;
    }
`;

const Summary = styled.aside`
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius};
    box-shadow: ${({ theme }) => theme.shadow};
    padding: 1.25rem;
    position: sticky;
    top: 100px;

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
        position: static;
    }
`;

const SummaryList = styled.ul`
    list-style: none;
    margin: 1rem 0;
    padding: 0 0 1rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.92rem;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.6rem;
`;

const TotalRow = styled(Row)`
    margin: 1rem 0 0;
    padding-top: 1rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 1.25rem;
    font-weight: 700;
`;

const Empty = styled.section`
    text-align: center;
    padding: 3rem 1rem;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius};

    a {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 600;
    }
`;

export default function Checkout() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartTotal);
    const user = useSelector(selectUser);

    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;

    const [values, setValues] = useState({
        fullName: user.name,
        street: '',
        neighborhood: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        paymentMethod: 'card',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
    });
    const [addressErrors, setAddressErrors] = useState({});
    const [paymentErrors, setPaymentErrors] = useState({});
    const [savedPayment, setSavedPayment] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [orderError, setOrderError] = useState('');

    const errors = { ...addressErrors, ...paymentErrors };

    if (items.length === 0) {
        return (
            <Page>
                <Title>Finalizar compra</Title>
                <Empty>
                    <h2>No hay nada que pagar</h2>
                    <p>
                        Tu carrito está vacío. <Link to="/">Ver llaveros</Link>
                    </p>
                </Empty>
            </Page>
        );
    }

    const handleChange = (event) => {
        const { name, value } = event.target;

        setValues((previous) => ({ ...previous, [name]: value }));
    };

    const handleSavePayment = () => {
        const validation = validatePayment(values);

        setPaymentErrors(validation);

        if (Object.keys(validation).length > 0) {
            return;
        }

        const isCard = values.paymentMethod === 'card';

        // Pago simulado: de la tarjeta solo se conservan los últimos 4 dígitos
        setSavedPayment({
            method: values.paymentMethod,
            label: getPaymentLabel(values.paymentMethod),
            last4: isCard ? onlyDigits(values.cardNumber).slice(-4) : null,
        });
        setValues((previous) => ({ ...previous, cardNumber: '', cardExpiry: '', cardCvv: '' }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const addressValidation = validateAddress(values);
        const paymentValidation = savedPayment
            ? {}
            : { paymentMethod: 'Guarda tu método de pago antes de confirmar la compra.' };

        setAddressErrors(addressValidation);
        setPaymentErrors(paymentValidation);
        setOrderError('');

        if (Object.keys(addressValidation).length > 0 || !savedPayment) {
            return;
        }

        const payload = {
            items: items.map((item) => ({ product: item.id, quantity: item.quantity })),
            address: {
                fullName: values.fullName.trim(),
                street: values.street.trim(),
                neighborhood: values.neighborhood.trim(),
                city: values.city.trim(),
                state: values.state.trim(),
                zip: values.zip.trim(),
                phone: onlyDigits(values.phone),
            },
            payment: { method: savedPayment.method, last4: savedPayment.last4 },
        };

        setSubmitting(true);

        try {
            const { data: order } = await api.post('/orders/', payload);

            dispatch(placeOrder(order));
            dispatch(clearCart());
            navigate('/confirmacion', { replace: true });
        } catch (error) {
            setOrderError(getErrorMessage(error));
            setSubmitting(false);
        }
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <Page>
            <Title>Finalizar compra</Title>

            <Layout>
                <FormCard onSubmit={handleSubmit} noValidate aria-label="Formulario de pago">
                    {hasErrors && <FormError role="alert">Revisa los campos marcados en rojo.</FormError>}
                    {orderError && <FormError role="alert">{orderError}</FormError>}

                    <SectionTitle>Dirección de envío</SectionTitle>

                    <Field
                        id="fullName"
                        label="Nombre de quien recibe"
                        type="text"
                        autoComplete="name"
                        value={values.fullName}
                        onChange={handleChange}
                        error={errors.fullName}
                    />

                    <Field
                        id="street"
                        label="Calle y número"
                        type="text"
                        autoComplete="address-line1"
                        value={values.street}
                        onChange={handleChange}
                        error={errors.street}
                    />

                    <FieldRow>
                        <Field
                            id="neighborhood"
                            label="Colonia"
                            type="text"
                            autoComplete="address-line2"
                            value={values.neighborhood}
                            onChange={handleChange}
                            error={errors.neighborhood}
                        />
                        <Field
                            id="zip"
                            label="Código postal"
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            autoComplete="postal-code"
                            value={values.zip}
                            onChange={handleChange}
                            error={errors.zip}
                        />
                    </FieldRow>

                    <FieldRow>
                        <Field
                            id="city"
                            label="Ciudad"
                            type="text"
                            autoComplete="address-level2"
                            value={values.city}
                            onChange={handleChange}
                            error={errors.city}
                        />
                        <Field
                            id="state"
                            label="Estado"
                            type="text"
                            autoComplete="address-level1"
                            value={values.state}
                            onChange={handleChange}
                            error={errors.state}
                        />
                    </FieldRow>

                    <Field
                        id="phone"
                        label="Teléfono (10 dígitos)"
                        type="tel"
                        autoComplete="tel"
                        value={values.phone}
                        onChange={handleChange}
                        error={errors.phone}
                    />

                    <SectionTitle>Método de pago</SectionTitle>

                    <FormNotice>Pago simulado: no se hace ningún cargo real ni se guardan datos de tarjeta.</FormNotice>

                    {savedPayment && (
                        <SavedPayment role="status">
                            <p>
                                <strong>Método de pago guardado:</strong> {savedPayment.label}
                                {savedPayment.last4 && ` terminada en ${savedPayment.last4}`}
                            </p>
                            <SecondaryButton type="button" onClick={() => setSavedPayment(null)}>
                                Cambiar
                            </SecondaryButton>
                        </SavedPayment>
                    )}

                    {!savedPayment && (
                        <PaymentGroup aria-label="Método de pago">
                            {PAYMENT_METHODS.map((method) => (
                                <PaymentOption key={method.id} $selected={values.paymentMethod === method.id}>
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method.id}
                                        checked={values.paymentMethod === method.id}
                                        onChange={handleChange}
                                    />
                                    {method.label}
                                </PaymentOption>
                            ))}
                            {errors.paymentMethod && <ErrorText role="alert">{errors.paymentMethod}</ErrorText>}
                        </PaymentGroup>
                    )}

                    {!savedPayment && values.paymentMethod === 'card' && (
                        <>
                            <Field
                                id="cardNumber"
                                label="Número de tarjeta"
                                type="text"
                                inputMode="numeric"
                                maxLength={19}
                                placeholder="1234 5678 9012 3456"
                                autoComplete="cc-number"
                                value={values.cardNumber}
                                onChange={handleChange}
                                error={errors.cardNumber}
                            />

                            <FieldRow>
                                <Field
                                    id="cardExpiry"
                                    label="Vencimiento"
                                    type="text"
                                    maxLength={5}
                                    placeholder="MM/AA"
                                    autoComplete="cc-exp"
                                    value={values.cardExpiry}
                                    onChange={handleChange}
                                    error={errors.cardExpiry}
                                />
                                <Field
                                    id="cardCvv"
                                    label="CVV"
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    autoComplete="cc-csc"
                                    value={values.cardCvv}
                                    onChange={handleChange}
                                    error={errors.cardCvv}
                                />
                            </FieldRow>
                        </>
                    )}

                    {!savedPayment && (
                        <SecondaryButton type="button" onClick={handleSavePayment}>
                            Guardar método de pago
                        </SecondaryButton>
                    )}

                    <SubmitButton type="submit" disabled={submitting}>
                        Confirmar compra por {formatPrice(total)}
                    </SubmitButton>
                </FormCard>

                <Summary aria-label="Resumen del pedido">
                    <SectionTitle>Resumen del pedido</SectionTitle>

                    <SummaryList>
                        {items.map((item) => (
                            <Row as="li" key={item.id} style={{ marginBottom: 0 }}>
                                <span>
                                    {item.quantity} × {item.name}
                                </span>
                                <span>{formatPrice(item.price * item.quantity)}</span>
                            </Row>
                        ))}
                    </SummaryList>

                    <Row>
                        <span>Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                    </Row>
                    <Row>
                        <span>Envío</span>
                        <span>{shipping === 0 ? 'Gratis' : formatPrice(shipping)}</span>
                    </Row>

                    <TotalRow>
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                    </TotalRow>
                </Summary>
            </Layout>
        </Page>
    );
}
