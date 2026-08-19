import type {
    BaseDocument
} from './common.types';

export interface Family extends BaseDocument {
    name: string;
    ownerUserId: string;
}

export interface FamilyCreateData {
    name: string;
    ownerUserId: string;
}

export interface FamilyUpdateData {
    name?: string;
}

export type FamilyMemberRole =
    | 'parent'
    | 'child';

export type FamilyMemberStatus =
    | 'active'
    | 'inactive';

export interface FamilyMember extends BaseDocument {
    familyId: string;
    userId: string;

    role: FamilyMemberRole;
    status: FamilyMemberStatus;
}

export interface FamilyMemberCreateData {
    familyId: string;
    userId: string;

    role: FamilyMemberRole;
    status: FamilyMemberStatus;
}

export interface FamilyMemberUpdateData {
    status?: FamilyMemberStatus;
}