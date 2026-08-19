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

const PROJECT_ID = 'eduplay-teachers-test';

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

describe('Firestore Security Rules - teachers', () => {
    it('permite a un profesor leer su propio perfil', async () => {
        const teacherId = 'teacher-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'teachers', teacherId),
                    {
                        userId: teacherId,
                        firstName: 'Teacher',
                        lastName: 'Test',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'teachers', teacherId),
            ),
        );
    });

    it('impide a un profesor leer el perfil de otro profesor', async () => {
        const teacherA = 'teacher-test-001';
        const teacherB = 'teacher-test-002';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'teachers', teacherB),
                    {
                        userId: teacherB,
                        firstName: 'Teacher',
                        lastName: 'Other',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherA);

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'teachers', teacherB),
            ),
        );
    });

    it('permite a un profesor crear su propio perfil', async () => {
        const teacherId = 'teacher-test-001';

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            setDoc(
                doc(db, 'teachers', teacherId),
                {
                    userId: teacherId,
                    firstName: 'Teacher',
                    lastName: 'Test',
                },
            ),
        );
    });

    it('impide a un profesor crear un perfil perteneciente a otro usuario', async () => {
        const teacherA = 'teacher-test-001';
        const teacherB = 'teacher-test-002';

        const context =
            testEnv.authenticatedContext(teacherA);

        const db = context.firestore();

        await assertFails(
            setDoc(
                doc(db, 'teachers', teacherB),
                {
                    userId: teacherB,
                    firstName: 'Teacher',
                    lastName: 'Other',
                },
            ),
        );
    });

    it('permite a un profesor actualizar su propio perfil', async () => {
        const teacherId = 'teacher-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'teachers', teacherId),
                    {
                        userId: teacherId,
                        firstName: 'Teacher',
                        lastName: 'Original',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(db, 'teachers', teacherId),
                {
                    firstName: 'Teacher Updated',
                },
            ),
        );
    });

    it('impide a un profesor actualizar el perfil de otro profesor', async () => {
        const teacherA = 'teacher-test-001';
        const teacherB = 'teacher-test-002';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'teachers', teacherB),
                    {
                        userId: teacherB,
                        firstName: 'Teacher',
                        lastName: 'Other',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherA);

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(db, 'teachers', teacherB),
                {
                    firstName: 'Changed',
                },
            ),
        );
    });

    it('impide a un profesor eliminar su propio perfil', async () => {
        const teacherId = 'teacher-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'teachers', teacherId),
                    {
                        userId: teacherId,
                        firstName: 'Teacher',
                        lastName: 'Test',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertFails(
            deleteDoc(
                doc(db, 'teachers', teacherId),
            ),
        );
    });

    it('impide a un usuario no autenticado leer perfiles de profesores', async () => {
        const teacherId = 'teacher-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'teachers', teacherId),
                    {
                        userId: teacherId,
                        firstName: 'Teacher',
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
                doc(db, 'teachers', teacherId),
            ),
        );
    });
});