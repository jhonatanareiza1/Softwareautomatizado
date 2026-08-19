import { Link } from 'react-router-dom';

import AuthCard from '../../features/auth/components/AuthCard';
import RegisterForm from '../../features/auth/components/RegisterForm';

function Register() {
    return (
        <main className="auth-page">
            <div className="auth-page__brand">
                <h2>EduPlay</h2>
                <p>Aprende. Juega. Crece.</p>
            </div>

            <AuthCard
                title="Crea tu cuenta"
                subtitle="Empieza tu experiencia en EduPlay"
                footer={
                    <p>
                        ¿Ya tienes una cuenta?{' '}
                        <Link to="/login">
                            Iniciar sesión
                        </Link>
                    </p>
                }
            >
                <RegisterForm />
            </AuthCard>
        </main>
    );
}

export default Register;