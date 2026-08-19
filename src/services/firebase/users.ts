import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from 'firebase/firestore';

import { firestoreDb } from './config';

import type {
    User,
    UserCreateData,
    UserUpdateData,
} from '../../types';

const USERS_COLLECTION = 'users';

function mapUser(
    id: string,
    data: Record<string, unknown>,
): User {
    return {
        id,
        uid: data.uid as string,
        email: data.email as string,
        displayName: data.displayName as string,
        photoURL: (data.photoURL as string | null) ?? null,
        role: data.role as User['role'],
        status: data.status as User['status'],
        createdAt: data.createdAt as User['createdAt'],
        updatedAt: data.updatedAt as User['updatedAt'],
    };
}

export async function getUserProfile(
    uid: string,
): Promise<User | null> {
    const userRef = doc(
        firestoreDb,
        USERS_COLLECTION,
        uid,
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapUser(
        snapshot.id,
        snapshot.data(),
    );
}

export async function createUserProfile(
    data: UserCreateData,
): Promise<void> {
    const userRef = doc(
        firestoreDb,
        USERS_COLLECTION,
        data.uid,
    );

    await setDoc(userRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

export async function updateUserProfile(
    uid: string,
    data: UserUpdateData,
): Promise<void> {
    const userRef = doc(
        firestoreDb,
        USERS_COLLECTION,
        uid,
    );

    await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
    });
}