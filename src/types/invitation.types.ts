import type {
    BaseDocument,
    FirestoreTimestamp,
} from './common.types';

export type InvitationType =
    | 'family'
    | 'group';

export type InvitationStatus =
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'expired'
    | 'cancelled';

export type InvitationRole =
    | 'parent'
    | 'child'
    | 'student'
    | 'teacher';

export interface Invitation extends BaseDocument {
    type: InvitationType;

    targetId: string;

    invitedEmail: string | null;
    invitedUserId: string | null;

    invitedByUserId: string;

    role: InvitationRole;

    status: InvitationStatus;

    expiresAt: FirestoreTimestamp;

    acceptedAt: FirestoreTimestamp | null;
}

export interface InvitationCreateData {
    type: InvitationType;

    targetId: string;

    invitedEmail?: string | null;
    invitedUserId?: string | null;

    invitedByUserId: string;

    role: InvitationRole;

    status: InvitationStatus;

    expiresAt: FirestoreTimestamp;

    acceptedAt?: FirestoreTimestamp | null;
}

export interface InvitationUpdateData {
    status?: InvitationStatus;
    acceptedAt?: FirestoreTimestamp | null;
}