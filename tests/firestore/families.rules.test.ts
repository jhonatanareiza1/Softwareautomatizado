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

const PROJECT_ID = 'eduplay-families-test';

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

describe('Firestore Security Rules - families', () => {
    it('permite a un miembro leer una familia', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'families', familyId),
                    {
                        ownerUserId: parentId,
                        name: 'Family Test',
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'familyMembers',
                        `${familyId}_${parentId}`,
                    ),
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
                doc(db, 'families', familyId),
            ),
        );
    });

    it('impide a un usuario que no es miembro leer una familia', async () => {
        const ownerId = 'parent-test-001';
        const otherUserId = 'parent-test-002';
        const familyId = 'family-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'families', familyId),
                    {
                        ownerUserId: ownerId,
                        name: 'Family Test',
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'familyMembers',
                        `${familyId}_${ownerId}`,
                    ),
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
                doc(db, 'families', familyId),
            ),
        );
    });

    it('permite a un padre crear su propia familia', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';

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
                doc(db, 'families', familyId),
                {
                    ownerUserId: parentId,
                    name: 'Family Test',
                },
            ),
        );
    });

    it('impide a un padre crear una familia perteneciente a otro usuario', async () => {
        const parentA = 'parent-test-001';
        const parentB = 'parent-test-002';
        const familyId = 'family-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', parentA),
                    {
                        uid: parentA,
                        email: 'parent1@test.com',
                        displayName: 'Parent One',
                        photoURL: null,
                        role: 'parent',
                    },
                );

                await setDoc(
                    doc(db, 'users', parentB),
                    {
                        uid: parentB,
                        email: 'parent2@test.com',
                        displayName: 'Parent Two',
                        photoURL: null,
                        role: 'parent',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentA);

        const db = context.firestore();

        await assertFails(
            setDoc(
                doc(db, 'families', familyId),
                {
                    ownerUserId: parentB,
                    name: 'Other Family',
                },
            ),
        );
    });

    it('impide a un usuario que no es padre crear una familia', async () => {
        const studentId = 'student-test-001';
        const familyId = 'family-test-001';

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
                doc(db, 'families', familyId),
                {
                    ownerUserId: studentId,
                    name: 'Student Family',
                },
            ),
        );
    });

    it('permite al propietario padre actualizar su familia', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';

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

                await setDoc(
                    doc(db, 'families', familyId),
                    {
                        ownerUserId: parentId,
                        name: 'Family Original',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(db, 'families', familyId),
                {
                    name: 'Family Updated',
                },
            ),
        );
    });

    it('impide a otro padre actualizar una familia ajena', async () => {
        const ownerId = 'parent-test-001';
        const otherParentId = 'parent-test-002';
        const familyId = 'family-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', ownerId),
                    {
                        uid: ownerId,
                        email: 'parent1@test.com',
                        displayName: 'Parent One',
                        photoURL: null,
                        role: 'parent',
                    },
                );

                await setDoc(
                    doc(db, 'users', otherParentId),
                    {
                        uid: otherParentId,
                        email: 'parent2@test.com',
                        displayName: 'Parent Two',
                        photoURL: null,
                        role: 'parent',
                    },
                );

                await setDoc(
                    doc(db, 'families', familyId),
                    {
                        ownerUserId: ownerId,
                        name: 'Family Original',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(otherParentId);

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(db, 'families', familyId),
                {
                    name: 'Changed By Other Parent',
                },
            ),
        );
    });

    it('impide a un padre eliminar una familia', async () => {
        const parentId = 'parent-test-001';
        const familyId = 'family-test-001';

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

                await setDoc(
                    doc(db, 'families', familyId),
                    {
                        ownerUserId: parentId,
                        name: 'Family Test',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertFails(
            deleteDoc(
                doc(db, 'families', familyId),
            ),
        );
    });
});