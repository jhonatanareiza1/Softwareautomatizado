import {
    useEffect,
    useState,
    type SyntheticEvent,
} from 'react';

import {
    useNavigate,
} from 'react-router-dom';

import {
    loginWithEmail,
} from '../../../services/firebase/auth';

import {
    useAuth,
} from '../context/AuthContext';

import {
    getRoleRoute,
} from '../../../routes/getRoleRoute';

import SocialLoginButtons from './SocialLoginButtons';

function LoginForm() {
    const navigate = useNavigate();

    const {
        profile,
        loading: authLoading,
    } = useAuth();

    const [email, setEmail] =
        useState('');

    const [password, setPassword] =
        useState('');

    const [error, setError] =
        useState('');

    const [loading, setLoading] =
        useState(false);

    useEffect(() => {
        if (
            !authLoading &&
            profile
        ) {
            navigate(
                getRoleRoute(profile.role),
                {
                    replace: true,
                },
            );
        }
    }, [
        authLoading,
        profile,
        navigate,
    ]);

    async function handleSubmit(
        event: SyntheticEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            await loginWithEmail(
                email,
                password,
            );
        } catch (error) {
            console.error(
                'Error al iniciar sesión:',
                error,
            );

            setError(
                'No hemos podido iniciar sesión. Comprueba tu email y contraseña.',
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <form
            className="auth-form"
            onSubmit={handleSubmit}
        >
            <SocialLoginButtons />

            <div className="auth-divider">
                <span>o</span>
            </div>

            <div className="form-field">
                <label htmlFor="login-email">
                    Email
                </label>

                <input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="Tu email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                        setEmail(
                            event.target.value,
                        )
                    }
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="login-password">
                    Contraseña
                </label>

                <input
                    id="login-password"
                    name="password"
                    type="password"
                    placeholder="Tu contraseña"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) =>
                        setPassword(
                            event.target.value,
                        )
                    }
                    required
                />
            </div>

            {error && (
                <p
                    className="auth-form__error"
                    role="alert"
                >
                    {error}
                </p>
            )}

            <button
                type="submit"
                className="button button--primary auth-form__submit"
                disabled={
                    loading ||
                    authLoading
                }
            >
                {loading
                    ? 'Iniciando sesión...'
                    : 'Iniciar sesión'}
            </button>
        </form>
    );
}

export default LoginForm;