import { useAuth } from '../../features/auth/context/AuthContext';

function Dashboard() {
    const {
        user,
        profile,
        logout,
    } = useAuth();

    async function handleLogout() {
        await logout();
    }

    return (
        <main>
            <h1>EduPlay</h1>

            <p>
                Has iniciado sesión correctamente.
            </p>

            <p>
                Firebase UID:
                {' '}
                {user?.uid}
            </p>

            <p>
                Email:
                {' '}
                {user?.email}
            </p>

            <p>
                Nombre:
                {' '}
                {profile?.displayName}
            </p>

            <p>
                Rol:
                {' '}
                {profile?.role}
            </p>

            <button
                type="button"
                onClick={handleLogout}
            >
                Cerrar sesión
            </button>
        </main>
    );
}

export default Dashboard;