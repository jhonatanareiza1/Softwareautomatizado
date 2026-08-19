import type { UserRole } from '../types/user';

export function getRoleRoute(
    role: UserRole,
): string {
    switch (role) {
        case 'student':
            return '/student';

        case 'parent':
            return '/parent';

        case 'teacher':
            return '/teacher';

        default:
            return '/dashboard';
    }
}