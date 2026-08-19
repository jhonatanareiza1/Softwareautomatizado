import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
    initializeTestEnvironment,
    assertSucceeds,
    assertFails,
    type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
} from 'firebase/firestore';

import { beforeAll, afterAll, beforeEach, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'eduplay-users-test';

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,

        firestore: {
            host: '127.0.0.1',
            port: 8081,

            rules: readFileSync(
                resolve(process.cwd(), 'firestore.rules'),
                'utf8',
            ),
        },
    });
});

afterAll(async () => {
    if (testEnv) {
        await testEnv.cleanup();
    }
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

describe('Firestore Security Rules - users', () => {
    it('permite a un usuario crear su propio documento', async () => {
        const userId = 'student-test-001';

        const context = testEnv.authenticatedContext(userId);

        const db = context.firestore();

        const userRef = doc(db, 'users', userId);

        await assertSucceeds(
            setDoc(userRef, {
                uid: userId,
                email: 'student@test.com',
                displayName: 'Student Test',
                photoURL: null,
                role: 'student',
            }),
        );
    });

    it('impide crear un usuario con un UID diferente', async () => {
        const authenticatedUserId = 'student-test-001';
        const documentUserId = 'student-test-002';

        const context = testEnv.authenticatedContext(
            authenticatedUserId,
        );

        const db = context.firestore();

        const userRef = doc(
            db,
            'users',
            documentUserId,
        );

        await assertFails(
            setDoc(userRef, {
                uid: documentUserId,
                email: 'other@test.com',
                displayName: 'Other User',
                photoURL: null,
                role: 'student',
            }),
        );
    });

    it('permite leer su propio documento', async () => {
        const userId = 'student-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', userId),
                    {
                        uid: userId,
                        email: 'student@test.com',
                        displayName: 'Student Test',
                        photoURL: null,
                        role: 'student',
                    },
                );
            },
        );

        const context = testEnv.authenticatedContext(userId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(doc(db, 'users', userId)),
        );
    });

    it('impide leer el documento de otro usuario', async () => {
        const ownerId = 'student-test-001';
        const attackerId = 'student-test-002';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', ownerId),
                    {
                        uid: ownerId,
                        email: 'owner@test.com',
                        displayName: 'Owner',
                        photoURL: null,
                        role: 'student',
                    },
                );
            },
        );

        const context = testEnv.authenticatedContext(
            attackerId,
        );

        const db = context.firestore();

        await assertFails(
            getDoc(doc(db, 'users', ownerId)),
        );
    });

    it('impide modificar el documento del usuario', async () => {
        const userId = 'student-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', userId),
                    {
                        uid: userId,
                        email: 'student@test.com',
                        displayName: 'Student Test',
                        photoURL: null,
                        role: 'student',
                    },
                );
            },
        );

        const context = testEnv.authenticatedContext(userId);

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(db, 'users', userId),
                {
                    role: 'teacher',
                },
            ),
        );
    });
});