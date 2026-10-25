import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { addToCart } from '../redux/cartSlice';
import { formatPrice } from '../utils/formatPrice';

const Card = styled.article`
    display: flex;
    flex-direction: column;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius};
    overflow: hidden;
    box-shadow: ${({ theme }) => theme.shadow};
    transition: transform 0.2s ease;

    &:hover {
        transform: translateY(-4px);
    }
`;

const ImageBox = styled.div`
    position: relative;
    width: 100%;
    aspect-ratio: 4 / 5;
    max-height: 340px;
    background: #fff;
    overflow: hidden;
`;

const Photo = styled.img`
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    padding: 0.75rem;
    object-fit: contain;
`;

const Body = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1rem;
    flex: 1;
`;

const Tag = styled.span`
    align-self: flex-start;
    font-size: 0.75rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.background};
    border-radius: 999px;
    padding: 0.15rem 0.6rem;
`;

const Name = styled.h3`
    margin: 0;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const Description = styled.p`
    margin: 0;
    font-size: 0.88rem;
    color: ${({ theme }) => theme.colors.muted};
    flex: 1;
`;

const Price = styled.p`
    margin: 0.25rem 0 0;
    font-size: 1.2rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text};
`;

const AddButton = styled.button`
    margin-top: 0.5rem;
    padding: 0.65rem 1rem;
    border: none;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background: ${({ theme }) => theme.colors.primaryLight};
    }

    &:focus-visible {
        outline: 3px solid ${({ theme }) => theme.colors.accent};
        outline-offset: 2px;
    }
`;

export default function ProductCard({ product }) {
    const dispatch = useDispatch();

    return (
        <Card>
            <ImageBox>
                <Photo src={product.image} alt={`Llavero ${product.name}`} loading="lazy" />
            </ImageBox>

            <Body>
                <Tag>{product.category}</Tag>
                <Name>{product.name}</Name>
                <Description>{product.description}</Description>
                <Price>{formatPrice(product.price)}</Price>

                <AddButton
                    type="button"
                    onClick={() => dispatch(addToCart(product))}
                    aria-label={`Agregar ${product.name} al carrito`}
                >
                    Agregar al carrito
                </AddButton>
            </Body>
        </Card>
    );
}