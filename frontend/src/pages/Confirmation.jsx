import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import api from '../api/client';
import { getErrorMessage } from '../api/errors';
import { placeOrder, selectLastOrder } from '../redux/orderSlice';
import { formatPrice } from '../utils/formatPrice';

const Page = styled.main`
    max-width: 760px;
    margin: 0 auto;
    padding: 2rem 1.25rem 3rem;
`;

const Card = styled.section`
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius};
    box-shadow: ${({ theme }) => theme.shadow};
    padding: 1.75rem;
`;

const Title = styled.h1`
    margin: 0 0 0.5rem;
    color: ${({ $tone, theme }) => theme.colors[$tone] ?? theme.colors.primaryDark};
`;

const Muted = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.muted};
`;

const Message = styled.p`
    margin: 1rem 0 0;
    padding: 0.8rem 0.9rem;
    border-radius: 8px;
    background: #fff8dc;
    border: 1px solid ${({ theme }) => theme.colors.accent};
`;

const SectionTitle = styled.h2`
    margin: 1.5rem 0 0.6rem;
    padding-top: 1.25rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 1.1rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const Text = styled.p`
    margin: 0 0 0.2rem;
`;

const List = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
`;

const TotalRow = styled(Row)`
    margin: 0.75rem 0 0;
    font-size: 1.2rem;
    font-weight: 700;
`;

const buttonStyles = `
    display: block;
    margin-top: 1.75rem;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
`;

const PrimaryLink = styled(Link)`
    ${buttonStyles}
    background: ${({ theme }) => theme.colors.primary};

    &:hover {
        background: ${({ theme }) => theme.colors.primaryLight};
    }
`;

const PayLink = styled.a`
    ${buttonStyles}
    background: #009ee3;

    &:hover {
        background: #0086c3;
    }
`;

const formatDate = (iso) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));

const firstName = (order) => order.customer.name.split(' ')[0];

const describe = (order) => {
    if (order.statusCode === 'paid') {
        return {
            tone: 'success',
            title: `¡Gracias por tu compra, ${firstName(order)}!`,
            message: null,
            totalLabel: 'Total pagado',
        };
    }

    if (order.statusCode === 'cancelled') {
        return {
            tone: 'danger',
            title: 'Tu pedido fue cancelado',
            message: 'El pago no se completó. Puedes volver a la tienda y hacer un nuevo pedido.',
            totalLabel: 'Total',
        };
    }

    if (order.paymentStatus === 'rejected') {
        return {
            tone: 'danger',
            title: 'Tu pago fue rechazado',
            message: 'Mercado Pago no aprobó el pago. Intenta con otra tarjeta u otro método de pago.',
            totalLabel: 'Total por pagar',
            payLabel: 'Intentar pagar de nuevo',
        };
    }

    if (order.paymentStatus === 'pending' || order.paymentStatus === 'in_process') {
        return {
            tone: 'primaryDark',
            title: 'Tu pago está en proceso',
            message: 'Si elegiste OXXO o SPEI, tu pedido se confirmará en cuanto realices el pago.',
            totalLabel: 'Total por pagar',
            payLabel: 'Ver instrucciones de pago',
        };
    }

    return {
        tone: 'primaryDark',
        title: 'Tu pedido está esperando el pago',
        message: 'Aún no recibimos tu pago. Completa el pago en Mercado Pago para confirmar tu pedido.',
        totalLabel: 'Total por pagar',
        payLabel: 'Pagar con Mercado Pago',
    };
};

const loadOrder = (code, paymentId) =>
    paymentId ? api.post(`/orders/${code}/pago/`, { payment_id: paymentId }) : api.get(`/orders/${code}/`);

export default function Confirmation() {
    const dispatch = useDispatch();
    const lastOrder = useSelector(selectLastOrder);
    const [searchParams] = useSearchParams();

    const code = searchParams.get('pedido');
    const paymentId = searchParams.get('payment_id') || searchParams.get('collection_id');
    const validPaymentId = paymentId && paymentId !== 'null' ? paymentId : null;

    const [order, setOrder] = useState(code ? null : lastOrder);
    const [error, setError] = useState('');

    const requested = useRef('');

    useEffect(() => {
        const key = `${code}:${validPaymentId}`;

        if (!code || requested.current === key) {
            return;
        }

        requested.current = key;

        loadOrder(code, validPaymentId)
            .then(({ data }) => {
                setOrder(data);
                dispatch(placeOrder(data));
            })
            .catch((requestError) => setError(getErrorMessage(requestError)));
    }, [code, validPaymentId, dispatch]);

    if (!code && !order) {
        return <Navigate to="/" replace />;
    }

    if (error) {
        return (
            <Page>
                <Card aria-label="Estado del pedido">
                    <Title $tone="danger">No pudimos consultar tu pedido</Title>
                    <Muted>{error}</Muted>
                    <PrimaryLink to="/">Volver a la tienda</PrimaryLink>
                </Card>
            </Page>
        );
    }

    if (!order) {
        return (
            <Page>
                <Card aria-label="Estado del pedido" aria-busy="true">
                    <Muted role="status">Confirmando tu pago…</Muted>
                </Card>
            </Page>
        );
    }

    const { address, payment } = order;
    const state = describe(order);

    return (
        <Page>
            <Card aria-label="Confirmación de compra">
                <Title $tone={state.tone}>{state.title}</Title>
                <Muted>
                    Pedido <strong>{order.id}</strong> · {formatDate(order.date)}
                </Muted>
                {order.statusCode === 'paid' && <Muted>Enviamos los detalles a {order.customer.email}.</Muted>}
                {state.message && <Message role="status">{state.message}</Message>}

                <SectionTitle>Productos</SectionTitle>
                <List>
                    {order.items.map((item) => (
                        <Row as="li" key={item.id}>
                            <span>
                                {item.quantity} × {item.name}
                            </span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                        </Row>
                    ))}
                </List>

                {address && (
                    <>
                        <SectionTitle>Dirección de envío</SectionTitle>
                        <Text>{address.fullName}</Text>
                        <Text>
                            {address.street}, {address.neighborhood}
                        </Text>
                        <Text>
                            {address.city}, {address.state}, C.P. {address.zip}
                        </Text>
                        <Text>Tel. {address.phone}</Text>
                    </>
                )}

                {payment && (
                    <>
                        <SectionTitle>Método de pago</SectionTitle>
                        <Text>
                            {payment.label}
                            {payment.last4 && ` terminada en ${payment.last4}`}
                        </Text>
                    </>
                )}

                <SectionTitle>Total</SectionTitle>
                <Row>
                    <span>Subtotal</span>
                    <span>{formatPrice(order.subtotal)}</span>
                </Row>
                <Row>
                    <span>Envío</span>
                    <span>{order.shipping === 0 ? 'Gratis' : formatPrice(order.shipping)}</span>
                </Row>
                <TotalRow>
                    <span>{state.totalLabel}</span>
                    <span>{formatPrice(order.total)}</span>
                </TotalRow>

                {order.checkoutUrl && state.payLabel && <PayLink href={order.checkoutUrl}>{state.payLabel}</PayLink>}
                <PrimaryLink to="/">Seguir comprando</PrimaryLink>
            </Card>
        </Page>
    );
}
