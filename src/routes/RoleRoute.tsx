import {
    Navigate,
    Outlet,
    useLocation,
} from 'react-router-dom';

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

    const location = useLocation();

    console.log(
        '[RoleRoute] Ruta actual:',
        location.pathname,
    );

    console.log(
        '[RoleRoute] Perfil:',
        profile,
    );

    console.log(
        '[RoleRoute] Rol:',
        profile?.role,
    );

    console.log(
        '[RoleRoute] Roles permitidos:',
        allowedRoles,
    );

    if (loading) {
        console.log(
            '[RoleRoute] Auth cargando...',
        );

        return (
            <p>
                Cargando EduPlay...
            </p>
        );
    }

    if (!profile) {
        console.log(
            '[RoleRoute] NO HAY PERFIL -> /login',
        );

        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    if (!allowedRoles.includes(profile.role)) {
        console.log(
            '[RoleRoute] ROL NO PERMITIDO -> /dashboard',
        );

        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    console.log(
        '[RoleRoute] ACCESO PERMITIDO:',
        location.pathname,
    );

    return <Outlet />;
}

export default RoleRoute;