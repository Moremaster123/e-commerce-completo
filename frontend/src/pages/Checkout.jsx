import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCartItems, selectCartTotal, clearCart } from '../redux/cartSlice';
import { selectUser } from '../redux/authSlice';
import { placeOrder } from '../redux/orderSlice';
import { formatPrice } from '../utils/formatPrice';
import { calculateShipping } from '../utils/shipping';
import { validateAddress } from '../utils/validators';
import { onlyDigits } from '../utils/payment';
import { redirectTo } from '../utils/redirect';
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

const MercadoPagoBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.9rem 1rem;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    border-radius: 8px;

    strong {
        color: ${({ theme }) => theme.colors.primaryDark};
    }

    p {
        margin: 0;
        font-size: 0.92rem;
        color: ${({ theme }) => theme.colors.muted};
    }
`;

const TEST_MODE = import.meta.env.VITE_PAGOS_PRUEBA !== '0';

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
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [orderError, setOrderError] = useState('');

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

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validation = validateAddress(values);

        setErrors(validation);
        setOrderError('');

        if (Object.keys(validation).length > 0) {
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
            payment: { method: 'mercadopago' },
        };

        setSubmitting(true);

        try {
            const { data: order } = await api.post('/orders/', payload);

            dispatch(placeOrder(order));
            dispatch(clearCart());

            if (order.checkoutUrl) {
                redirectTo(order.checkoutUrl);
            } else {
                navigate(`/confirmacion?pedido=${order.id}`, { replace: true });
            }
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

                    <MercadoPagoBox>
                        <strong>Mercado Pago</strong>
                        <p>Paga con tarjeta de crédito o débito, en efectivo en OXXO o por transferencia SPEI.</p>
                        <p>Te llevaremos a Mercado Pago para completar el pago de forma segura.</p>
                    </MercadoPagoBox>

                    {TEST_MODE && (
                        <FormNotice>
                            Modo de prueba: usa las tarjetas de prueba de Mercado Pago. No se hace ningún cargo real.
                        </FormNotice>
                    )}

                    <SubmitButton type="submit" disabled={submitting}>
                        {submitting ? 'Conectando con Mercado Pago…' : `Pagar ${formatPrice(total)} con Mercado Pago`}
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
