import { Link } from 'react-router-dom';
import styled from 'styled-components';

import { formatPrice } from '../utils/formatPrice';
import { FREE_SHIPPING_FROM } from '../utils/shipping';

const FooterBar = styled.footer`
    margin-top: auto;
    background: ${({ theme }) => theme.colors.primaryDark};
    color: #e6e3f7;
`;

const Inner = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.25rem 1.25rem;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 2rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
`;

const Brand = styled.p`
    margin: 0 0 0.5rem;
    font-size: 1.3rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: ${({ theme }) => theme.colors.accent};
`;

const Text = styled.p`
    margin: 0;
    max-width: 420px;
    font-size: 0.92rem;
`;

const ColumnTitle = styled.h2`
    margin: 0 0 0.6rem;
    font-size: 1rem;
    color: #fff;
`;

const LinkList = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.92rem;

    a {
        text-decoration: none;

        &:hover {
            color: ${({ theme }) => theme.colors.accent};
        }
    }
`;

const Bottom = styled.p`
    margin: 0;
    padding: 1rem 1.25rem;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    text-align: center;
    font-size: 0.82rem;
`;

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
    return (
        <FooterBar>
            <Inner>
                <div>
                    <Brand>ROMXNO</Brand>
                    <Text>
                        Llaveros de tela tejida con diseños manga y streetwear, hechos para
                        acompañarte todos los días.
                    </Text>
                </div>

                <nav aria-label="Enlaces del pie de página">
                    <ColumnTitle>Tienda</ColumnTitle>
                    <LinkList>
                        <li>
                            <Link to="/">Catálogo</Link>
                        </li>
                        <li>
                            <Link to="/carrito">Carrito</Link>
                        </li>
                        <li>
                            <Link to="/login">Mi cuenta</Link>
                        </li>
                    </LinkList>
                </nav>

                <div>
                    <ColumnTitle>Envíos</ColumnTitle>
                    <LinkList as="div">
                        <span>Envío a todo México.</span>
                        <span>Gratis en compras desde {formatPrice(FREE_SHIPPING_FROM)}.</span>
                    </LinkList>
                </div>
            </Inner>

            <Bottom>
                © {CURRENT_YEAR} ROMXNO. Proyecto escolar: la tienda y los pagos son simulados.
            </Bottom>
        </FooterBar>
    );
}
