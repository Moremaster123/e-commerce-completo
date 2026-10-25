import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { register, selectUser } from '../redux/authSlice';
import { validateRegister } from '../utils/validators';
import {
    Field,
    FormPage,
    FormCard,
    FormTitle,
    FormText,
    FormError,
    SubmitButton,
    FormFooter,
} from '../components/FormElements';

export default function Register() {
    const dispatch = useDispatch();
    const user = useSelector(selectUser);
    const location = useLocation();

    const redirectTo = location.state?.from || '/';

    const [values, setValues] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
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

        const validation = validateRegister(values);

        setErrors(validation);
        setFormError('');

        if (Object.keys(validation).length > 0) {
            return;
        }

        setSubmitting(true);
        const result = await dispatch(
            register({
                name: values.name,
                email: values.email,
                password: values.password,
            })
        );
        setSubmitting(false);

        if (!result.ok) {
            setFormError(result.error);
        }
    };

    return (
        <FormPage>
            <FormCard onSubmit={handleSubmit} noValidate aria-label="Formulario de registro">
                <FormTitle>Crear cuenta</FormTitle>
                <FormText>Regístrate para guardar tus compras y pagar más rápido.</FormText>

                {formError && <FormError role="alert">{formError}</FormError>}

                <Field
                    id="name"
                    label="Nombre"
                    type="text"
                    autoComplete="name"
                    value={values.name}
                    onChange={handleChange}
                    error={errors.name}
                />

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
                    autoComplete="new-password"
                    value={values.password}
                    onChange={handleChange}
                    error={errors.password}
                />

                <Field
                    id="confirmPassword"
                    label="Confirmar contraseña"
                    type="password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                />

                <SubmitButton type="submit" disabled={submitting}>
                    Crear cuenta
                </SubmitButton>
            </FormCard>

            <FormFooter>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" state={location.state}>
                    Ingresa
                </Link>
            </FormFooter>
        </FormPage>
    );
}
