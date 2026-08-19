import type {
    BaseDocument,
    FirestoreTimestamp,
} from './common.types';

export type GroupStatus =
    | 'active'
    | 'inactive'
    | 'archived';

export interface Group extends BaseDocument {
    name: string;
    description: string | null;
    schoolName: string | null;

    ownerTeacherId: string;

    status: GroupStatus;
}

export interface GroupCreateData {
    name: string;
    description?: string | null;
    schoolName?: string | null;

    ownerTeacherId: string;

    status: GroupStatus;
}

export interface GroupUpdateData {
    name?: string;
    description?: string | null;
    schoolName?: string | null;
}

export type GroupMemberStatus =
    | 'active'
    | 'inactive'
    | 'left';

export interface GroupMember extends BaseDocument {
    groupId: string;
    studentId: string;

    status: GroupMemberStatus;

    joinedAt: FirestoreTimestamp;
    leftAt: FirestoreTimestamp | null;
}

export interface GroupMemberCreateData {
    groupId: string;
    studentId: string;

    status: GroupMemberStatus;

    joinedAt: FirestoreTimestamp;
    leftAt?: FirestoreTimestamp | null;
}

export interface GroupMemberUpdateData {
    status?: GroupMemberStatus;
    leftAt?: FirestoreTimestamp | null;
}

export type GroupTeacherRole =
    | 'teacher'
    | 'assistant';

export type GroupTeacherStatus =
    | 'active'
    | 'inactive';

export interface GroupTeacher extends BaseDocument {
    groupId: string;
    teacherId: string;

    role: GroupTeacherRole;

    status: GroupTeacherStatus;

    assignedAt: FirestoreTimestamp;
}

export interface GroupTeacherCreateData {
    groupId: string;
    teacherId: string;

    role: GroupTeacherRole;

    status: GroupTeacherStatus;

    assignedAt: FirestoreTimestamp;
}

export interface GroupTeacherUpdateData {
    role?: GroupTeacherRole;
    status?: GroupTeacherStatus;
}