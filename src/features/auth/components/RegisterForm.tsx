import {
    useState,
    type SyntheticEvent,
} from 'react';

import { registerWithEmail } from '../../../services/firebase/auth';
import type { UserRole } from '../../../types/user';

import SocialLoginButtons from './SocialLoginButtons';

function RegisterForm() {
    const [name, setName] = useState('');
    const [lastName, setLastName] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [role, setRole] = useState<UserRole>('parent');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();

        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);

        try {
            await registerWithEmail({
                email,
                password,
                displayName: `${name} ${lastName}`.trim(),
                role,
            });
            console.log('Usuario registrado correctamente');
        } catch (error) {
            console.error(error);

            setError(
                'No hemos podido crear la cuenta. Comprueba los datos.',
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
                <label htmlFor="register-name">
                    Nombre
                </label>

                <input
                    id="register-name"
                    type="text"
                    value={name}
                    onChange={(event) =>
                        setName(event.target.value)
                    }
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="register-last-name">
                    Apellidos
                </label>

                <input
                    id="register-last-name"
                    type="text"
                    value={lastName}
                    onChange={(event) =>
                        setLastName(event.target.value)
                    }
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="register-email">
                    Email
                </label>

                <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="register-password">
                    Contraseña
                </label>

                <input
                    id="register-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="register-confirm-password">
                    Confirmar contraseña
                </label>

                <input
                    id="register-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) =>
                        setConfirmPassword(event.target.value)
                    }
                    required
                />
            </div>

            <div className="form-field">
                <label htmlFor="register-role">
                    Tipo de cuenta
                </label>

                <select
                    id="register-role"
                    value={role}
                    onChange={(event) =>
                        setRole(event.target.value as UserRole)
                    }
                >
                    <option value="parent">
                        Padre / Madre
                    </option>

                    <option value="teacher">
                        Docente
                    </option>

                    <option value="student">
                        Estudiante
                    </option>
                </select>
            </div>

            {error && (
                <p role="alert">
                    {error}
                </p>
            )}

            <button
                type="submit"
                className="button button--primary auth-form__submit"
                disabled={loading}
            >
                {loading
                    ? 'Creando cuenta...'
                    : 'Crear cuenta'}
            </button>
        </form>
    );
}

export default RegisterForm;