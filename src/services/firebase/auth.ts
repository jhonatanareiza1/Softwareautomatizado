import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    FacebookAuthProvider,
    updateProfile,
    type User as FirebaseUser,
} from 'firebase/auth';

import { firebaseAuth } from './config';

import {
    createUserProfile,
} from './users';

import type {
    UserRole,
    UserCreateData,
} from '../../types';

const googleProvider =
    new GoogleAuthProvider();

const facebookProvider =
    new FacebookAuthProvider();

interface RegisterUserData {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
}

export async function registerWithEmail(
    data: RegisterUserData,
): Promise<FirebaseUser> {
    const credential =
        await createUserWithEmailAndPassword(
            firebaseAuth,
            data.email,
            data.password,
        );

    const firebaseUser =
        credential.user;

    await updateProfile(
        firebaseUser,
        {
            displayName:
                data.displayName,
        },
    );

    const userData: UserCreateData = {
        uid: firebaseUser.uid,

        email:
            firebaseUser.email ??
            data.email,

        displayName:
            data.displayName,

        photoURL:
            firebaseUser.photoURL ??
            null,

        role: data.role,

        status: 'active',
    };

    await createUserProfile(
        userData,
    );

    return firebaseUser;
}

export async function loginWithEmail(
    email: string,
    password: string,
): Promise<FirebaseUser> {
    const credential =
        await signInWithEmailAndPassword(
            firebaseAuth,
            email,
            password,
        );

    return credential.user;
}

export async function loginWithGoogle(): Promise<FirebaseUser> {
    const credential =
        await signInWithPopup(
            firebaseAuth,
            googleProvider,
        );

    const firebaseUser =
        credential.user;

    await ensureUserProfile(
        firebaseUser,
        'student',
    );

    return firebaseUser;
}

export async function loginWithFacebook(): Promise<FirebaseUser> {
    const credential =
        await signInWithPopup(
            firebaseAuth,
            facebookProvider,
        );

    const firebaseUser =
        credential.user;

    await ensureUserProfile(
        firebaseUser,
        'student',
    );

    return firebaseUser;
}

async function ensureUserProfile(
    firebaseUser: FirebaseUser,
    defaultRole: UserRole,
): Promise<void> {
    const userData: UserCreateData = {
        uid: firebaseUser.uid,

        email:
            firebaseUser.email ?? '',

        displayName:
            firebaseUser.displayName ?? '',

        photoURL:
            firebaseUser.photoURL ??
            null,

        role: defaultRole,

        status: 'active',
    };

    /*
     * Aquí posteriormente comprobaremos
     * si el documento ya existe antes
     * de crearlo.
     */
    await createUserProfile(
        userData,
    );
}