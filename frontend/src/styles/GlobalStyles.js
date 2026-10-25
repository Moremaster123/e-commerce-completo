import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
    *, *::before, *::after {
        box-sizing: border-box;
    }

    body {
        margin: 0;
        font-family: 'Segoe UI', Roboto, Arial, sans-serif;
        background: ${({ theme }) => theme.colors.background};
        color: ${({ theme }) => theme.colors.text};
        line-height: 1.5;
    }

    #root {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    img {
        max-width: 100%;
        display: block;
    }

    a {
        color: inherit;
    }

    button {
        font-family: inherit;
    }
`;

export default GlobalStyles;