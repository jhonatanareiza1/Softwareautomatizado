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
    await testEnv?.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

describe('Firestore Security Rules - topics', () => {
    it('permite a un usuario autenticado leer un topic', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: 'teacher-001',
                },
            );
        });

        const context = testEnv.authenticatedContext('student-001');

        await assertSucceeds(
            getDoc(doc(context.firestore(), 'topics', 'topic-001')),
        );
    });

    it('impide a un usuario no autenticado leer un topic', async () => {
        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: 'teacher-001',
                },
            );
        });

        await assertFails(
            getDoc(
                testEnv.unauthenticatedContext().firestore()
                && doc(
                    testEnv.unauthenticatedContext().firestore(),
                    'topics',
                    'topic-001',
                ),
            ),
        );
    });

    it('permite al docente crear un topic propio', async () => {
        const teacherId = 'teacher-001';

        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(
                doc(context.firestore(), 'users', teacherId),
                {
                    uid: teacherId,
                    role: 'teacher',
                },
            );
        });

        const context = testEnv.authenticatedContext(teacherId);

        await assertSucceeds(
            setDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: teacherId,
                },
            ),
        );
    });

    it('impide a un estudiante crear un topic', async () => {
        const context =
            testEnv.authenticatedContext('student-001');

        await assertFails(
            setDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: 'student-001',
                },
            ),
        );
    });

    it('impide a un docente crear un topic de otro propietario', async () => {
        const teacherId = 'teacher-001';

        await testEnv.withSecurityRulesDisabled(async (context) => {
            await setDoc(
                doc(context.firestore(), 'users', teacherId),
                {
                    uid: teacherId,
                    role: 'teacher',
                },
            );
        });

        const context = testEnv.authenticatedContext(teacherId);

        await assertFails(
            setDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: 'teacher-999',
                },
            ),
        );
    });

    it('permite al propietario actualizar su topic', async () => {
        const teacherId = 'teacher-001';

        await testEnv.withSecurityRulesDisabled(async (context) => {
            const db = context.firestore();

            await setDoc(
                doc(db, 'users', teacherId),
                {
                    uid: teacherId,
                    role: 'teacher',
                },
            );

            await setDoc(
                doc(db, 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: teacherId,
                },
            );
        });

        const context = testEnv.authenticatedContext(teacherId);

        await assertSucceeds(
            updateDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
                {
                    name: 'Numbers 1',
                },
            ),
        );
    });

    it('impide cambiar el propietario del topic', async () => {
        const teacherId = 'teacher-001';

        await testEnv.withSecurityRulesDisabled(async (context) => {
            const db = context.firestore();

            await setDoc(
                doc(db, 'users', teacherId),
                {
                    uid: teacherId,
                    role: 'teacher',
                },
            );

            await setDoc(
                doc(db, 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: teacherId,
                },
            );
        });

        const context = testEnv.authenticatedContext(teacherId);

        await assertFails(
            updateDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
                {
                    ownerTeacherId: 'teacher-999',
                },
            ),
        );
    });

    it('impide eliminar un topic', async () => {
        const teacherId = 'teacher-001';

        await testEnv.withSecurityRulesDisabled(async (context) => {
            const db = context.firestore();

            await setDoc(
                doc(db, 'users', teacherId),
                {
                    uid: teacherId,
                    role: 'teacher',
                },
            );

            await setDoc(
                doc(db, 'topics', 'topic-001'),
                {
                    name: 'Numbers',
                    ownerTeacherId: teacherId,
                },
            );
        });

        const context = testEnv.authenticatedContext(teacherId);

        await assertFails(
            deleteDoc(
                doc(context.firestore(), 'topics', 'topic-001'),
            ),
        );
    });
});
