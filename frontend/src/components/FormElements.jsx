import styled from 'styled-components';

export const FormPage = styled.main`
    max-width: 440px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 3rem;
`;

export const FormCard = styled.form`
    display: flex;
    flex-direction: column;
    gap: 1rem;
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radius};
    box-shadow: ${({ theme }) => theme.shadow};
    padding: 1.75rem;
`;

export const FormTitle = styled.h1`
    margin: 0;
    font-size: 1.6rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

export const FormText = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.muted};
`;

export const FormNotice = styled.p`
    margin: 0;
    padding: 0.7rem 0.9rem;
    border-radius: 8px;
    background: #fff8dc;
    border: 1px solid ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.text};
    font-size: 0.9rem;
`;

export const FormError = styled.p`
    margin: 0;
    padding: 0.7rem 0.9rem;
    border-radius: 8px;
    background: #fdecea;
    border: 1px solid ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.danger};
    font-size: 0.9rem;
`;

const FieldWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
`;

const Label = styled.label`
    font-weight: 600;
    font-size: 0.92rem;
    color: ${({ theme }) => theme.colors.primaryDark};
`;

const Input = styled.input`
    padding: 0.7rem 0.8rem;
    border: 2px solid ${({ $invalid, theme }) => ($invalid ? theme.colors.danger : theme.colors.border)};
    border-radius: 8px;
    font-size: 1rem;
    background: #fff;
    color: ${({ theme }) => theme.colors.text};

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.primaryLight};
    }
`;

const ErrorText = styled.span`
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.danger};
`;

export function Field({ id, label, error, ...inputProps }) {
    return (
        <FieldWrap>
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                name={id}
                $invalid={Boolean(error)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                {...inputProps}
            />
            {error && (
                <ErrorText id={`${id}-error`} role="alert">
                    {error}
                </ErrorText>
            )}
        </FieldWrap>
    );
}

export const SubmitButton = styled.button`
    margin-top: 0.5rem;
    padding: 0.85rem 1rem;
    border: none;
    border-radius: 8px;
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.primaryLight};
    }

    &:focus-visible {
        outline: 3px solid ${({ theme }) => theme.colors.accent};
        outline-offset: 2px;
    }
`;

export const FormFooter = styled.p`
    margin: 1.25rem 0 0;
    text-align: center;
    color: ${({ theme }) => theme.colors.muted};

    a {
        color: ${({ theme }) => theme.colors.primary};
        font-weight: 600;
    }
`;
