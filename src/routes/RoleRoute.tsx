import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../features/auth/context/AuthContext';

import type { UserRole } from '../types/user';

interface RoleRouteProps {
    allowedRoles: UserRole[];
}

function RoleRoute({
    allowedRoles,
}: RoleRouteProps) {
    const {
        profile,
        loading,
    } = useAuth();

    if (loading) {
        return <p>Cargando EduPlay...</p>;
    }

    if (!profile) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (!allowedRoles.includes(profile.role)) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return <Outlet />;
}

export default RoleRoute;