import { useState } from 'react';
import styled from 'styled-components';

import localProducts, { CATEGORIES } from '../data/products';
import ProductCard from '../components/ProductCard';
import useApi from '../hooks/useApi';
import { formatPrice } from '../utils/formatPrice';
import { FREE_SHIPPING_FROM } from '../utils/shipping';

const toProduct = (product) => ({
    ...product,
    price: Number(product.price),
    image: `${import.meta.env.BASE_URL}images/${product.image}`,
});

const Notice = styled.p`
    margin: 0 0 1.25rem;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    background: #fff4e5;
    color: #8a4b00;
`;

const Hero = styled.section`
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primaryDark}, ${({ theme }) => theme.colors.primary});
    color: #fff;
    text-align: center;
    padding: 3.5rem 1.25rem;
`;

const HeroTitle = styled.h1`
    margin: 0 0 0.75rem;
    font-size: clamp(1.7rem, 5vw, 2.8rem);
`;

const HeroText = styled.p`
    margin: 0 auto;
    max-width: 560px;
    font-size: 1.05rem;
    color: #e6e3f7;
`;

const Accent = styled.span`
    color: ${({ theme }) => theme.colors.accent};
`;

const Benefits = styled.ul`
    list-style: none;
    margin: 0;
    padding: 0.8rem 1.25rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem 2rem;
    background: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.primaryDark};
    font-weight: 600;
    font-size: 0.95rem;
    text-align: center;
`;

const About = styled.section`
    margin-top: 3rem;
    padding: 1.75rem;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-left: 6px solid ${({ theme }) => theme.colors.accent};
    border-radius: ${({ theme }) => theme.radius};

    p {
        margin: 0 0 0.75rem;
        max-width: 780px;
    }

    p:last-child {
        margin-bottom: 0;
    }
`;

const Content = styled.main`
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1.25rem 3rem;
`;

const SectionTitle = styled.h2`
    margin: 0 0 1rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const Filters = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-bottom: 1.5rem;
`;

const FilterButton = styled.button`
    padding: 0.45rem 1.1rem;
    border-radius: 999px;
    border: 2px solid ${({ theme }) => theme.colors.primary};
    background: ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
    color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.primary)};
    font-weight: 600;
    cursor: pointer;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 1.25rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
        grid-template-columns: 1fr;
    }
`;

export default function Home() {
    const [category, setCategory] = useState('Todos');
    const { data, loading, error } = useApi('/products/', category === 'Todos' ? {} : { category });

    const offlineProducts =
        category === 'Todos'
            ? localProducts
            : localProducts.filter((product) => product.category === category);

    const visibleProducts = error ? offlineProducts : (data ?? []).map(toProduct);

    return (
        <>
            <Hero>
                <HeroTitle>
                    Lleva tu estilo en las <Accent>llaves</Accent>
                </HeroTitle>
                <HeroText>
                    Llaveros de tela tejida con diseños manga y streetwear. Resistentes,
                    ligeros y hechos para acompañarte todos los días.
                </HeroText>
            </Hero>

            <Benefits aria-label="Beneficios de la tienda">
                <li>Envío gratis desde {formatPrice(FREE_SHIPPING_FROM)}</li>
                <li>Envíos a todo México</li>
                <li>Tela tejida resistente</li>
            </Benefits>

            <Content>
                <SectionTitle>Nuestros llaveros</SectionTitle>

                <Filters role="group" aria-label="Filtrar por categoría">
                    {CATEGORIES.map((item) => (
                        <FilterButton
                            key={item}
                            type="button"
                            $active={item === category}
                            aria-pressed={item === category}
                            onClick={() => setCategory(item)}
                        >
                            {item}
                        </FilterButton>
                    ))}
                </Filters>

                {error && (
                    <Notice role="alert">
                        {error} Mientras tanto te mostramos nuestro catálogo guardado.
                    </Notice>
                )}

                {loading ? (
                    <p role="status">Cargando llaveros...</p>
                ) : (
                    <Grid>
                        {visibleProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </Grid>
                )}

                <About aria-labelledby="sobre-romxno">
                    <SectionTitle id="sobre-romxno">Sobre ROMXNO</SectionTitle>
                    <p>
                        ROMXNO nació de una idea sencilla: las llaves van contigo a todos lados,
                        así que también pueden decir algo de ti. Por eso hacemos llaveros de tela
                        tejida con diseños inspirados en el manga y la cultura streetwear.
                    </p>
                    <p>
                        Cada pieza es ligera, resistente al uso diario y lleva herraje metálico.
                        Cuélgala de tus llaves, tu mochila o tu credencial y elige el diseño que
                        vaya con tu estilo.
                    </p>
                </About>
            </Content>
        </>
    );
}