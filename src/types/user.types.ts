import type { BaseDocument } from './common.types';

export type UserRole =
    | 'student'
    | 'parent'
    | 'teacher';

export type UserStatus =
    | 'active'
    | 'pending'
    | 'suspended';

export interface User extends BaseDocument {
    uid: string;

    email: string;
    displayName: string;
    photoURL: string | null;

    role: UserRole;
    status: UserStatus;
}

export interface UserCreateData {
    uid: string;

    email: string;
    displayName: string;
    photoURL: string | null;

    role: UserRole;
    status: UserStatus;
}

export interface UserUpdateData {
    displayName?: string;
    photoURL?: string | null;
}