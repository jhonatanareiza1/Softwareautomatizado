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
    deleteDoc,
} from 'firebase/firestore';

import {
    beforeAll,
    afterAll,
    beforeEach,
    describe,
    it,
} from 'vitest';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'eduplay-family-members-test';

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

describe('Firestore Security Rules - familyMembers', () => {
    it('permite a un miembro leer su propio registro', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${parentId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'familyMembers', memberId),
                    {
                        familyId,
                        userId: parentId,
                        role: 'parent',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'familyMembers', memberId),
            ),
        );
    });

    it('impide a un usuario leer el registro de otro miembro', async () => {
        const ownerId = 'parent-test-001';
        const otherUserId = 'parent-test-002';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${ownerId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'familyMembers', memberId),
                    {
                        familyId,
                        userId: ownerId,
                        role: 'parent',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(otherUserId);

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'familyMembers', memberId),
            ),
        );
    });

    it('permite a un padre crear un miembro familiar', async () => {
        const parentId = 'parent-test-001';
        const studentId = 'student-test-001';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${studentId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', parentId),
                    {
                        uid: parentId,
                        email: 'parent@test.com',
                        displayName: 'Parent Test',
                        photoURL: null,
                        role: 'parent',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            setDoc(
                doc(db, 'familyMembers', memberId),
                {
                    familyId,
                    userId: studentId,
                    role: 'student',
                },
            ),
        );
    });

    it('impide a un estudiante crear un miembro familiar', async () => {
        const studentId = 'student-test-001';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${studentId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', studentId),
                    {
                        uid: studentId,
                        email: 'student@test.com',
                        displayName: 'Student Test',
                        photoURL: null,
                        role: 'student',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertFails(
            setDoc(
                doc(db, 'familyMembers', memberId),
                {
                    familyId,
                    userId: studentId,
                    role: 'student',
                },
            ),
        );
    });

    it('permite a un miembro actualizar su propio registro', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${parentId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'familyMembers', memberId),
                    {
                        familyId,
                        userId: parentId,
                        role: 'parent',
                        displayName: 'Parent Original',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(db, 'familyMembers', memberId),
                {
                    displayName: 'Parent Updated',
                },
            ),
        );
    });

    it('impide a un usuario actualizar el registro de otro miembro', async () => {
        const ownerId = 'parent-test-001';
        const otherUserId = 'parent-test-002';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${ownerId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'familyMembers', memberId),
                    {
                        familyId,
                        userId: ownerId,
                        role: 'parent',
                        displayName: 'Parent One',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(otherUserId);

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(db, 'familyMembers', memberId),
                {
                    displayName: 'Changed By Other User',
                },
            ),
        );
    });

    it('impide a un miembro eliminar su propio registro', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${parentId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'familyMembers', memberId),
                    {
                        familyId,
                        userId: parentId,
                        role: 'parent',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertFails(
            deleteDoc(
                doc(db, 'familyMembers', memberId),
            ),
        );
    });

    it('impide a un usuario no autenticado leer miembros familiares', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';
        const memberId = `${familyId}_${parentId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'familyMembers', memberId),
                    {
                        familyId,
                        userId: parentId,
                        role: 'parent',
                    },
                );
            },
        );

        const context = testEnv.unauthenticatedContext();

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'familyMembers', memberId),
            ),
        );
    });
});