import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

import {
    selectCartItems,
    selectCartTotal,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    clearCart,
} from '../redux/cartSlice';
import { formatPrice } from '../utils/formatPrice';
import { calculateShipping, FREE_SHIPPING_FROM } from '../utils/shipping';

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

const List = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const Item = styled.li`
    display: grid;
    grid-template-columns: 90px 1fr auto;
    gap: 1rem;
    align-items: center;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius};
    padding: 0.9rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 70px 1fr;
    }
`;

const Thumb = styled.img`
    width: 100%;
    aspect-ratio: 1 / 1;
    object-fit: contain;
    background: #fff;
    border-radius: 8px;
`;

const Info = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const ItemName = styled.h2`
    margin: 0;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const Muted = styled.span`
    font-size: 0.88rem;
    color: ${({ theme }) => theme.colors.muted};
`;

const LineTotal = styled.strong`
    font-size: 1.05rem;
`;

const Controls = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-column: 1 / -1;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
`;

const Quantity = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const QtyButton = styled.button`
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    background: transparent;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.1rem;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.primary};
        color: #fff;
    }
`;

const TextButton = styled.button`
    background: none;
    border: none;
    padding: 0;
    color: ${({ theme }) => theme.colors.danger};
    font-size: 0.85rem;
    text-decoration: underline;
    cursor: pointer;
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

const SummaryTitle = styled.h2`
    margin: 0 0 1rem;
    font-size: 1.2rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const Row = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.6rem;
`;

const TotalRow = styled(Row)`
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 1.25rem;
    font-weight: 700;
`;

const Hint = styled.p`
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.muted};
`;

const PrimaryLink = styled(Link)`
    display: block;
    margin-top: 1.25rem;
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

const Empty = styled.section`
    text-align: center;
    padding: 3rem 1rem;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius};
`;

export default function Cart() {
    const dispatch = useDispatch();
    const items = useSelector(selectCartItems);
    const subtotal = useSelector(selectCartTotal);

    const shipping = calculateShipping(subtotal);
    const total = subtotal + shipping;

    if (items.length === 0) {
        return (
            <Page>
                <Title>Tu carrito</Title>
                <Empty>
                    <h2>Tu carrito está vacío</h2>
                    <p>Todavía no agregas ningún llavero. ¡Échale un ojo al catálogo!</p>
                    <PrimaryLink to="/">Ver llaveros</PrimaryLink>
                </Empty>
            </Page>
        );
    }

    return (
        <Page>
            <Title>Tu carrito</Title>

            <Layout>
                <section aria-label="Productos en el carrito">
                    <List>
                        {items.map((item) => (
                            <Item key={item.id}>
                                <Thumb src={item.image} alt={`Llavero ${item.name}`} />

                                <Info>
                                    <ItemName>{item.name}</ItemName>
                                    <Muted>{formatPrice(item.price)} c/u</Muted>
                                    <LineTotal>{formatPrice(item.price * item.quantity)}</LineTotal>
                                </Info>

                                <Controls>
                                    <Quantity>
                                        <QtyButton
                                            type="button"
                                            aria-label={`Disminuir cantidad de ${item.name}`}
                                            onClick={() => dispatch(decreaseQuantity(item.id))}
                                        >
                                            −
                                        </QtyButton>
                                        <span aria-label={`Cantidad de ${item.name}`}>{item.quantity}</span>
                                        <QtyButton
                                            type="button"
                                            aria-label={`Aumentar cantidad de ${item.name}`}
                                            onClick={() => dispatch(increaseQuantity(item.id))}
                                        >
                                            +
                                        </QtyButton>
                                    </Quantity>

                                    <TextButton
                                        type="button"
                                        aria-label={`Quitar ${item.name} del carrito`}
                                        onClick={() => dispatch(removeFromCart(item.id))}
                                    >
                                        Quitar
                                    </TextButton>
                                </Controls>
                            </Item>
                        ))}
                    </List>

                    <TextButton
                        type="button"
                        style={{ marginTop: '1rem' }}
                        onClick={() => dispatch(clearCart())}
                    >
                        Vaciar carrito
                    </TextButton>
                </section>

                <Summary aria-label="Resumen del pedido">
                    <SummaryTitle>Resumen del pedido</SummaryTitle>

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

                    {shipping > 0 && (
                        <Hint>
                            Agrega {formatPrice(FREE_SHIPPING_FROM - subtotal)} más y el envío es gratis.
                        </Hint>
                    )}

                    <PrimaryLink to="/checkout">Ir a pagar</PrimaryLink>
                </Summary>
            </Layout>
        </Page>
    );
}