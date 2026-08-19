export type UserRole = 'student' | 'parent' | 'teacher';

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    photoURL: string | null;
    createdAt: string;
    updatedAt: string;
}