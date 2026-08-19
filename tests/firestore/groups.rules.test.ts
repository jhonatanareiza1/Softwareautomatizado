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

import {
    beforeAll,
    afterAll,
    beforeEach,
    describe,
    it,
} from 'vitest';

let testEnv: RulesTestEnvironment;

const PROJECT_ID = 'eduplay-test-groups';

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

describe('Firestore Security Rules - groups', () => {
    it('permite a un profesor crear su propio grupo', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';

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
                doc(db, 'groups', groupId),
                {
                    name: 'Group Test',
                    ownerTeacherId: teacherId,
                },
            ),
        );
    });

    it('impide a un profesor crear un grupo perteneciente a otro profesor', async () => {
        const teacherId = 'teacher-test-001';
        const otherTeacherId = 'teacher-test-002';
        const groupId = 'group-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', teacherId),
                    {
                        uid: teacherId,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(db, 'users', otherTeacherId),
                    {
                        uid: otherTeacherId,
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
                doc(db, 'groups', groupId),
                {
                    name: 'Other Group',
                    ownerTeacherId: otherTeacherId,
                },
            ),
        );
    });

    it('permite a un estudiante miembro leer el grupo', async () => {
        const studentId = 'student-test-001';
        const groupId = 'group-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groups', groupId),
                    {
                        name: 'Group Test',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupMembers',
                        `${groupId}_${studentId}`,
                    ),
                    {
                        groupId,
                        studentId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(doc(db, 'groups', groupId)),
        );
    });

    it('permite a un profesor miembro leer el grupo', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groups', groupId),
                    {
                        name: 'Group Test',
                        ownerTeacherId: teacherId,
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupTeachers',
                        `${groupId}_${teacherId}`,
                    ),
                    {
                        groupId,
                        teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(doc(db, 'groups', groupId)),
        );
    });

    it('impide a un estudiante que no pertenece al grupo leerlo', async () => {
        const studentId = 'student-test-001';
        const groupId = 'group-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groups', groupId),
                    {
                        name: 'Group Test',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertFails(
            getDoc(doc(db, 'groups', groupId)),
        );
    });

    it('permite a un profesor miembro actualizar el grupo', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groups', groupId),
                    {
                        name: 'Group Test',
                        ownerTeacherId: teacherId,
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupTeachers',
                        `${groupId}_${teacherId}`,
                    ),
                    {
                        groupId,
                        teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(db, 'groups', groupId),
                {
                    name: 'Updated Group',
                },
            ),
        );
    });

    it('impide a un estudiante actualizar el grupo', async () => {
        const studentId = 'student-test-001';
        const groupId = 'group-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groups', groupId),
                    {
                        name: 'Group Test',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupMembers',
                        `${groupId}_${studentId}`,
                    ),
                    {
                        groupId,
                        studentId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(db, 'groups', groupId),
                {
                    name: 'Hacked Group',
                },
            ),
        );
    });

    it('impide eliminar un grupo', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groups', groupId),
                    {
                        name: 'Group Test',
                        ownerTeacherId: teacherId,
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupTeachers',
                        `${groupId}_${teacherId}`,
                    ),
                    {
                        groupId,
                        teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        const { deleteDoc } = await import('firebase/firestore');

        await assertFails(
            deleteDoc(doc(db, 'groups', groupId)),
        );
    });
});
