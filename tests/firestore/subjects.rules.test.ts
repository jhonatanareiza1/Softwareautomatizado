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

const PROJECT_ID = 'eduplay-test';

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

describe('Firestore Security Rules - subjects', () => {
    it('permite a un docente leer una materia', async () => {
        const teacherId = 'teacher-test-001';
        const subjectId = 'subject-test-001';

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
                    doc(db, 'subjects', subjectId),
                    {
                        name: 'Matemáticas',
                        ownerTeacherId: teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'subjects', subjectId),
            ),
        );
    });

    it('permite a un estudiante leer una materia', async () => {
        const studentId = 'student-test-001';
        const subjectId = 'subject-test-001';

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

                await setDoc(
                    doc(db, 'subjects', subjectId),
                    {
                        name: 'Matemáticas',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'subjects', subjectId),
            ),
        );
    });

    it('permite a un padre leer una materia', async () => {
        const parentId = 'parent-test-001';
        const subjectId = 'subject-test-001';

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
                    doc(db, 'subjects', subjectId),
                    {
                        name: 'Matemáticas',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(parentId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'subjects', subjectId),
            ),
        );
    });

    it('impide a un usuario no autenticado leer una materia', async () => {
        const subjectId = 'subject-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'subjects', subjectId),
                    {
                        name: 'Matemáticas',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );
            },
        );

        const context =
            testEnv.unauthenticatedContext();

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'subjects', subjectId),
            ),
        );
    });

    it('permite a un docente crear una materia propia', async () => {
        const teacherId = 'teacher-test-001';
        const subjectId = 'subject-test-001';

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
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            setDoc(
                doc(db, 'subjects', subjectId),
                {
                    name: 'Matemáticas',
                    ownerTeacherId: teacherId,
                },
            ),
        );
    });

    it('impide a un docente crear una materia de otro docente', async () => {
        const teacherId = 'teacher-test-001';
        const otherTeacherId = 'teacher-test-002';
        const subjectId = 'subject-test-001';

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
                    doc(db, 'users', otherTeacherId),
                    {
                        uid: otherTeacherId,
                        email: 'otherteacher@test.com',
                        displayName: 'Other Teacher',
                        photoURL: null,
                        role: 'teacher',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertFails(
            setDoc(
                doc(db, 'subjects', subjectId),
                {
                    name: 'Matemáticas',
                    ownerTeacherId: otherTeacherId,
                },
            ),
        );
    });

    it('permite al docente propietario actualizar su materia', async () => {
        const teacherId = 'teacher-test-001';
        const subjectId = 'subject-test-001';

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
                    doc(db, 'subjects', subjectId),
                    {
                        name: 'Matemáticas',
                        ownerTeacherId: teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(db, 'subjects', subjectId),
                {
                    name: 'Matemáticas Avanzadas',
                },
            ),
        );
    });

    it('impide a otro docente actualizar una materia ajena', async () => {
        const teacherId = 'teacher-test-001';
        const otherTeacherId = 'teacher-test-002';
        const subjectId = 'subject-test-001';

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
                    doc(db, 'users', otherTeacherId),
                    {
                        uid: otherTeacherId,
                        email: 'otherteacher@test.com',
                        displayName: 'Other Teacher',
                        photoURL: null,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(db, 'subjects', subjectId),
                    {
                        name: 'Matemáticas',
                        ownerTeacherId: teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(otherTeacherId);

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(db, 'subjects', subjectId),
                {
                    name: 'Materia modificada',
                },
            ),
        );
    });

    it('impide eliminar una materia desde el cliente', async () => {
        const teacherId = 'teacher-test-001';
        const subjectId = 'subject-test-001';

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
                    doc(db, 'subjects', subjectId),
                    {
                        name: 'Matemáticas',
                        ownerTeacherId: teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertFails(
            deleteDoc(
                doc(db, 'subjects', subjectId),
            ),
        );
    });
});