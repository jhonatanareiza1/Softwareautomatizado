import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';

import { firestoreDb } from './config';

import type {
    Invitation,
    InvitationCreateData,
    InvitationUpdateData,
} from '../../types';

const INVITATIONS_COLLECTION =
    'invitations';

function mapInvitation(
    id: string,
    data: Record<string, unknown>,
): Invitation {
    return {
        id,

        type:
            data.type as Invitation['type'],

        targetId:
            data.targetId as string,

        invitedEmail:
            (data.invitedEmail as string | null) ??
            null,

        invitedUserId:
            (data.invitedUserId as string | null) ??
            null,

        invitedByUserId:
            data.invitedByUserId as string,

        role:
            data.role as Invitation['role'],

        status:
            data.status as Invitation['status'],

        expiresAt:
            data.expiresAt as Invitation['expiresAt'],

        acceptedAt:
            (data.acceptedAt as Invitation['acceptedAt']) ??
            null,

        createdAt:
            data.createdAt as Invitation['createdAt'],

        updatedAt:
            data.updatedAt as Invitation['updatedAt'],
    };
}

export async function getInvitation(
    invitationId: string,
): Promise<Invitation | null> {
    const invitationRef = doc(
        firestoreDb,
        INVITATIONS_COLLECTION,
        invitationId,
    );

    const snapshot =
        await getDoc(invitationRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapInvitation(
        snapshot.id,
        snapshot.data(),
    );
}

export async function getInvitationsForUser(
    userId: string,
): Promise<Invitation[]> {
    const invitationsRef =
        collection(
            firestoreDb,
            INVITATIONS_COLLECTION,
        );

    const invitationQuery = query(
        invitationsRef,
        where(
            'invitedUserId',
            '==',
            userId,
        ),
    );

    const snapshot =
        await getDocs(invitationQuery);

    return snapshot.docs.map(
        (document) =>
            mapInvitation(
                document.id,
                document.data(),
            ),
    );
}

export async function createInvitation(
    data: InvitationCreateData,
): Promise<string> {
    const invitationRef = doc(
        collection(
            firestoreDb,
            INVITATIONS_COLLECTION,
        ),
    );

    await setDoc(invitationRef, {
        ...data,

        invitedEmail:
            data.invitedEmail ?? null,

        invitedUserId:
            data.invitedUserId ?? null,

        acceptedAt:
            data.acceptedAt ?? null,

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp(),
    });

    return invitationRef.id;
}

export async function updateInvitation(
    invitationId: string,
    data: InvitationUpdateData,
): Promise<void> {
    const invitationRef = doc(
        firestoreDb,
        INVITATIONS_COLLECTION,
        invitationId,
    );

    await updateDoc(invitationRef, {
        ...data,

        updatedAt:
            serverTimestamp(),
    });
}

export async function deleteInvitation(
    invitationId: string,
): Promise<void> {
    const invitationRef = doc(
        firestoreDb,
        INVITATIONS_COLLECTION,
        invitationId,
    );

    await deleteDoc(invitationRef);
}