import { Link, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectLastOrder } from '../redux/orderSlice';
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
    color: ${({ theme }) => theme.colors.success};
`;

const Muted = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.muted};
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

const PrimaryLink = styled(Link)`
    display: block;
    margin-top: 1.75rem;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    font-weight: 600;
    text-align: center;
    text-decoration: none;

    &:hover {
        background: ${({ theme }) => theme.colors.primaryLight};
    }
`;

const formatDate = (iso) =>
    new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));

export default function Confirmation() {
    const order = useSelector(selectLastOrder);

    if (!order) {
        return <Navigate to="/" replace />;
    }

    const { address, payment } = order;

    return (
        <Page>
            <Card aria-label="Confirmación de compra">
                <Title>¡Gracias por tu compra, {order.customer.name.split(' ')[0]}!</Title>
                <Muted>
                    Pedido <strong>{order.id}</strong> · {formatDate(order.date)}
                </Muted>
                <Muted>Enviamos los detalles a {order.customer.email}.</Muted>

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

                <SectionTitle>Dirección de envío</SectionTitle>
                <Text>{address.fullName}</Text>
                <Text>
                    {address.street}, {address.neighborhood}
                </Text>
                <Text>
                    {address.city}, {address.state}, C.P. {address.zip}
                </Text>
                <Text>Tel. {address.phone}</Text>

                <SectionTitle>Método de pago</SectionTitle>
                <Text>
                    {payment.label}
                    {payment.last4 && ` terminada en ${payment.last4}`}
                </Text>

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
                    <span>Total pagado</span>
                    <span>{formatPrice(order.total)}</span>
                </TotalRow>

                <PrimaryLink to="/">Seguir comprando</PrimaryLink>
            </Card>
        </Page>
    );
}
