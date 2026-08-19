import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../features/auth/context/AuthContext';

function ProtectedRoute() {
    const {
        user,
        loading,
    } = useAuth();

    if (loading) {
        return <p>Cargando EduPlay...</p>;
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;