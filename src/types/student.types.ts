import type { BaseDocument } from './common.types';

export type StudentStatus =
    | 'active'
    | 'inactive'
    | 'suspended';

export interface Student extends BaseDocument {
    userId: string;

    firstName: string;
    lastName: string;

    birthYear: number | null;

    avatarId: string | null;

    schoolName: string | null;

    status: StudentStatus;
}

export interface StudentCreateData {
    userId: string;

    firstName: string;
    lastName: string;

    birthYear?: number | null;

    avatarId?: string | null;

    schoolName?: string | null;

    status: StudentStatus;
}

export interface StudentUpdateData {
    firstName?: string;
    lastName?: string;

    birthYear?: number | null;

    avatarId?: string | null;

    schoolName?: string | null;
}