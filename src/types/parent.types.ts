import type { BaseDocument } from './common.types';

export type ParentStatus =
    | 'active'
    | 'inactive'
    | 'suspended';

export interface Parent extends BaseDocument {
    userId: string;

    firstName: string;
    lastName: string;

    phone: string | null;

    status: ParentStatus;
}

export interface ParentCreateData {
    userId: string;

    firstName: string;
    lastName: string;

    phone?: string | null;

    status: ParentStatus;
}

export interface ParentUpdateData {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
}