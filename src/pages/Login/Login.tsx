import { Link } from 'react-router-dom';

import AuthCard from '../../features/auth/components/AuthCard';
import LoginForm from '../../features/auth/components/LoginForm';

function Login() {
    return (
        <main className="auth-page">
            <div className="auth-page__brand">
                <h2>EduPlay</h2>
                <p>Aprende. Juega. Crece.</p>
            </div>

            <AuthCard
                title="Bienvenido a EduPlay"
                subtitle="Inicia sesión para continuar"
                footer={
                    <p>
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register">
                            Registrarte
                        </Link>
                    </p>
                }
            >
                <LoginForm />
            </AuthCard>
        </main>
    );
}

export default Login;