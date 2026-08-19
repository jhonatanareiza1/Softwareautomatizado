import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';

import { firestoreDb } from './config';

import type {
    Parent,
    ParentCreateData,
    ParentUpdateData,
} from '../../types';

const PARENTS_COLLECTION = 'parents';

function mapParent(
    id: string,
    data: Record<string, unknown>,
): Parent {
    return {
        id,

        userId:
            data.userId as string,

        firstName:
            data.firstName as string,

        lastName:
            data.lastName as string,

        phone:
            (data.phone as string | null) ?? null,

        status:
            data.status as Parent['status'],

        createdAt:
            data.createdAt as Parent['createdAt'],

        updatedAt:
            data.updatedAt as Parent['updatedAt'],
    };
}

export async function getParent(
    parentId: string,
): Promise<Parent | null> {
    const parentRef = doc(
        firestoreDb,
        PARENTS_COLLECTION,
        parentId,
    );

    const snapshot =
        await getDoc(parentRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapParent(
        snapshot.id,
        snapshot.data(),
    );
}

export async function getParentByUserId(
    userId: string,
): Promise<Parent | null> {
    const parentsRef = collection(
        firestoreDb,
        PARENTS_COLLECTION,
    );

    const parentQuery = query(
        parentsRef,
        where('userId', '==', userId),
        limit(1),
    );

    const snapshot =
        await getDocs(parentQuery);

    if (snapshot.empty) {
        return null;
    }

    const document =
        snapshot.docs[0];

    return mapParent(
        document.id,
        document.data(),
    );
}

export async function createParent(
    data: ParentCreateData,
): Promise<string> {
    const parentRef = doc(
        collection(
            firestoreDb,
            PARENTS_COLLECTION,
        ),
    );

    await setDoc(parentRef, {
        ...data,
        phone:
            data.phone ?? null,
        createdAt:
            serverTimestamp(),
        updatedAt:
            serverTimestamp(),
    });

    return parentRef.id;
}

export async function updateParent(
    parentId: string,
    data: ParentUpdateData,
): Promise<void> {
    const parentRef = doc(
        firestoreDb,
        PARENTS_COLLECTION,
        parentId,
    );

    await updateDoc(parentRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function deleteParent(
    parentId: string,
): Promise<void> {
    const parentRef = doc(
        firestoreDb,
        PARENTS_COLLECTION,
        parentId,
    );

    await deleteDoc(parentRef);
}