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
} from 'firebase/firestore';

import {
    beforeAll,
    afterAll,
    beforeEach,
    describe,
    it,
} from 'vitest';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'eduplay-students-test';

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

describe('Firestore Security Rules - students', () => {

    it('permite a un estudiante leer su propio perfil', async () => {
        const userId = 'student-test-001';
        const studentId = 'student-test-001';

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

                await setDoc(
                    doc(db, 'students', studentId),
                    {
                        userId,
                        firstName: 'Student',
                        lastName: 'Test',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(userId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'students', studentId),
            ),
        );
    });

    it('impide a un estudiante leer el perfil de otro estudiante', async () => {
        const studentA = 'student-test-001';
        const studentB = 'student-test-002';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', studentA),
                    {
                        uid: studentA,
                        email: 'student1@test.com',
                        displayName: 'Student One',
                        photoURL: null,
                        role: 'student',
                    },
                );

                await setDoc(
                    doc(db, 'users', studentB),
                    {
                        uid: studentB,
                        email: 'student2@test.com',
                        displayName: 'Student Two',
                        photoURL: null,
                        role: 'student',
                    },
                );

                await setDoc(
                    doc(db, 'students', studentB),
                    {
                        userId: studentB,
                        firstName: 'Student',
                        lastName: 'Two',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentA);

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'students', studentB),
            ),
        );
    });

    it('permite a un padre leer perfiles de estudiantes', async () => {
        const parentId = 'parent-test-001';
        const studentId = 'student-test-001';

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
                    doc(db, 'students', studentId),
                    {
                        userId: studentId,
                        firstName: 'Student',
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
                doc(db, 'students', studentId),
            ),
        );
    });

    it('permite a un profesor leer perfiles de estudiantes', async () => {
        const teacherId = 'teacher-test-001';
        const studentId = 'student-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', teacherId),
                    {
                        uid: teacherId,
                        email: 'teacher@test.com',
                        displayName: 'Teacher Test',
                        photoURL: null,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(db, 'students', studentId),
                    {
                        userId: studentId,
                        firstName: 'Student',
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
                doc(db, 'students', studentId),
            ),
        );
    });

    it('impide a un usuario sin autenticación leer estudiantes', async () => {
        const studentId = 'student-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'students', studentId),
                    {
                        userId: studentId,
                        firstName: 'Student',
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
                doc(db, 'students', studentId),
            ),
        );
    });
});