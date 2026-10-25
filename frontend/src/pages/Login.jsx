import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { login, selectUser } from '../redux/authSlice';
import { validateLogin } from '../utils/validators';
import {
    Field,
    FormPage,
    FormCard,
    FormTitle,
    FormText,
    FormNotice,
    FormError,
    SubmitButton,
    FormFooter,
} from '../components/FormElements';

export default function Login() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const location = useLocation();

    const from = location.state?.from;
    const redirectTo = from || '/';

    const [values, setValues] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to={redirectTo} replace />;
    }

    const handleChange = (event) => {
        const { name, value } = event.target;

        setValues((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validation = validateLogin(values);

        setErrors(validation);
        setFormError('');

        if (Object.keys(validation).length > 0) {
            return;
        }

        setSubmitting(true);
        const result = await dispatch(login(values.email, values.password));
        setSubmitting(false);

        if (!result.ok) {
            setFormError(result.error);
        }
    };

    return (
        <FormPage>
            <FormCard onSubmit={handleSubmit} noValidate aria-label="Formulario de inicio de sesión">
                <FormTitle>Ingresar</FormTitle>
                <FormText>Entra a tu cuenta para completar tu compra.</FormText>

                {from === '/checkout' && (
                    <FormNotice>Inicia sesión o crea una cuenta para continuar con tu compra.</FormNotice>
                )}

                {formError && <FormError role="alert">{formError}</FormError>}

                <Field
                    id="email"
                    label="Correo electrónico"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={handleChange}
                    error={errors.email}
                />

                <Field
                    id="password"
                    label="Contraseña"
                    type="password"
                    autoComplete="current-password"
                    value={values.password}
                    onChange={handleChange}
                    error={errors.password}
                />

                <SubmitButton type="submit" disabled={submitting}>
                    Ingresar
                </SubmitButton>
            </FormCard>

            <FormFooter>
                ¿Aún no tienes cuenta?{' '}
                <Link to="/registro" state={location.state}>
                    Regístrate
                </Link>
            </FormFooter>
        </FormPage>
    );
}
