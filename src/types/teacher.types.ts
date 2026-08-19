import type { BaseDocument } from './common.types';

export type TeacherStatus =
    | 'active'
    | 'inactive'
    | 'suspended';

export interface Teacher extends BaseDocument {
    userId: string;

    firstName: string;
    lastName: string;

    schoolName: string | null;

    status: TeacherStatus;
}

export interface TeacherCreateData {
    userId: string;

    firstName: string;
    lastName: string;

    schoolName?: string | null;

    status: TeacherStatus;
}

export interface TeacherUpdateData {
    firstName?: string;
    lastName?: string;
    schoolName?: string | null;
}