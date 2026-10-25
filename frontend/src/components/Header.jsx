import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectCartCount } from '../redux/cartSlice';
import { selectUser, logout } from '../redux/authSlice';

const HeaderBar = styled.header`
    position: sticky;
    top: 0;
    z-index: 10;
    background: ${({ theme }) => theme.colors.surface};
    border-bottom: 3px solid ${({ theme }) => theme.colors.primary};
`;

const Inner = styled.div`
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.75rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
`;

const LogoImg = styled.img`
    height: 44px;
    width: auto;
`;

const MenuButton = styled.button`
    display: none;
    background: none;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
    border-radius: 8px;
    padding: 0.35rem 0.7rem;
    font-size: 1.2rem;
    cursor: pointer;

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
        display: block;
    }
`;

const Nav = styled.nav`
    display: flex;
    align-items: center;
    gap: 1.5rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
        display: ${({ $open }) => ($open ? 'flex' : 'none')};
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        gap: 0.75rem;
        padding-bottom: 0.5rem;
    }
`;

const NavItem = styled(NavLink)`
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    text-decoration: none;
    padding-bottom: 2px;
    border-bottom: 2px solid transparent;

    &:hover {
        color: ${({ theme }) => theme.colors.primaryLight};
    }

    &.active {
        border-bottom-color: ${({ theme }) => theme.colors.accent};
    }
`;

const Greeting = styled.span`
    color: ${({ theme }) => theme.colors.muted};
    font-weight: 600;
`;

const LogoutButton = styled.button`
    background: none;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    border-radius: 999px;
    padding: 0.2rem 0.9rem;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.primary};
        color: #fff;
    }
`;

const CartBadge = styled.span`
    display: inline-block;
    margin-left: 0.4rem;
    min-width: 1.4rem;
    padding: 0 0.4rem;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.primaryDark};
    font-size: 0.8rem;
    text-align: center;
`;

export default function Header() {
    const [open, setOpen] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const count = useSelector(selectCartCount);
    const user = useSelector(selectUser);

    const closeMenu = () => setOpen(false);

    const handleLogout = () => {
        dispatch(logout());
        closeMenu();
        navigate('/');
    };

    return (
        <HeaderBar>
            <Inner>
                <Link to="/" onClick={closeMenu} aria-label="ROMXNO, ir al inicio">
                    <LogoImg src={`${import.meta.env.BASE_URL}images/logo.svg`} alt="ROMXNO" />
                </Link>

                <MenuButton
                    type="button"
                    aria-label="Abrir menú"
                    aria-expanded={open}
                    onClick={() => setOpen(!open)}
                >
                    ☰
                </MenuButton>

                <Nav $open={open}>
                    <NavItem to="/" end onClick={closeMenu}>
                        Inicio
                    </NavItem>
                    <NavItem to="/carrito" onClick={closeMenu}>
                        Carrito
                        {count > 0 && <CartBadge>{count}</CartBadge>}
                    </NavItem>

                    {user ? (
                        <>
                            <Greeting>Hola, {user.name.split(' ')[0]}</Greeting>
                            <LogoutButton type="button" onClick={handleLogout}>
                                Salir
                            </LogoutButton>
                        </>
                    ) : (
                        <>
                            <NavItem to="/login" onClick={closeMenu}>
                                Ingresar
                            </NavItem>
                            <NavItem to="/registro" onClick={closeMenu}>
                                Crear cuenta
                            </NavItem>
                        </>
                    )}
                </Nav>
            </Inner>
        </HeaderBar>
    );
}