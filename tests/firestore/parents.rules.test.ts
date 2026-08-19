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

const PROJECT_ID = 'eduplay-parents-test';

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

describe('Firestore Security Rules - parents', () => {

    it('permite a un padre leer su propio perfil', async () => {
        const parentId = 'parent-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'parents', parentId),
                    {
                        userId: parentId,
                        firstName: 'Parent',
                        lastName: 'Test',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'parents', parentId),
            ),
        );
    });

    it('impide a un padre leer el perfil de otro padre', async () => {
        const parentA = 'parent-test-001';
        const parentB = 'parent-test-002';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'parents', parentB),
                    {
                        userId: parentB,
                        firstName: 'Parent',
                        lastName: 'Two',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentA);

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'parents', parentB),
            ),
        );
    });

    it('permite a un padre crear su propio perfil', async () => {
        const parentId = 'parent-test-001';

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            setDoc(
                doc(db, 'parents', parentId),
                {
                    userId: parentId,
                    firstName: 'Parent',
                    lastName: 'Test',
                },
            ),
        );
    });

    it('impide a un padre crear un perfil perteneciente a otro usuario', async () => {
        const parentA = 'parent-test-001';
        const parentB = 'parent-test-002';

        const context =
            testEnv.authenticatedContext(parentA);

        const db = context.firestore();

        await assertFails(
            setDoc(
                doc(db, 'parents', parentB),
                {
                    userId: parentB,
                    firstName: 'Parent',
                    lastName: 'Other',
                },
            ),
        );
    });

    it('impide a un padre eliminar su propio perfil', async () => {
        const parentId = 'parent-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'parents', parentId),
                    {
                        userId: parentId,
                        firstName: 'Parent',
                        lastName: 'Test',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertFails(
            deleteDoc(
                doc(db, 'parents', parentId),
            ),
        );
    });

    it('permite a un padre actualizar su propio perfil', async () => {
        const parentId = 'parent-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'parents', parentId),
                    {
                        userId: parentId,
                        firstName: 'Parent',
                        lastName: 'Original',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(db, 'parents', parentId),
                {
                    firstName: 'Parent Updated',
                },
            ),
        );
    });

    it('impide a un padre actualizar el perfil de otro padre', async () => {
        const parentA = 'parent-test-001';
        const parentB = 'parent-test-002';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'parents', parentB),
                    {
                        userId: parentB,
                        firstName: 'Parent',
                        lastName: 'Two',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentA);

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(db, 'parents', parentB),
                {
                    firstName: 'Hacked',
                },
            ),
        );
    });

    it('impide a un usuario no autenticado leer perfiles de padres', async () => {
        const parentId = 'parent-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'parents', parentId),
                    {
                        userId: parentId,
                        firstName: 'Parent',
                        lastName: 'Test',
                    },
                );
            },
        );

        const context =
            testEnv.unauthenticatedContext();

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'parents', parentId),
            ),
        );
    });

});
