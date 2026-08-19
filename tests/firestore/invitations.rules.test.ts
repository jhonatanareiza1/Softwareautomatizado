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

describe('Firestore Security Rules - invitations', () => {
    it('permite al usuario invitado leer su propia invitación', async () => {
        const studentId = 'student-test-001';
        const invitationId = 'invitation-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'invitations', invitationId),
                    {
                        invitedUserId: studentId,
                        invitedByUserId: 'teacher-test-001',
                        type: 'group',
                        targetId: 'group-test-001',
                        status: 'pending',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
            ),
        );
    });

    it('permite al usuario que creó la invitación leerla', async () => {
        const teacherId = 'teacher-test-001';
        const invitationId = 'invitation-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'invitations', invitationId),
                    {
                        invitedUserId: 'student-test-001',
                        invitedByUserId: teacherId,
                        type: 'group',
                        targetId: 'group-test-001',
                        status: 'pending',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
            ),
        );
    });

    it('impide a otro usuario leer una invitación ajena', async () => {
        const invitationId = 'invitation-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'invitations', invitationId),
                    {
                        invitedUserId: 'student-test-001',
                        invitedByUserId: 'teacher-test-001',
                        type: 'group',
                        targetId: 'group-test-001',
                        status: 'pending',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                'student-test-999',
            );

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
            ),
        );
    });

    it('permite a un usuario crear una invitación para sí mismo como invitado', async () => {
        const teacherId = 'teacher-test-001';
        const studentId = 'student-test-001';
        const invitationId = 'invitation-test-001';

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
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            setDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
                {
                    invitedUserId: studentId,
                    invitedByUserId: teacherId,
                    type: 'group',
                    targetId: 'group-test-001',
                    status: 'pending',
                },
            ),
        );
    });

    it('impide crear una invitación con invitedByUserId diferente al usuario autenticado', async () => {
        const teacherId = 'teacher-test-001';
        const otherTeacherId = 'teacher-test-002';
        const invitationId = 'invitation-test-001';

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
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertFails(
            setDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
                {
                    invitedUserId: 'student-test-001',
                    invitedByUserId: otherTeacherId,
                    type: 'group',
                    targetId: 'group-test-001',
                    status: 'pending',
                },
            ),
        );
    });

    it('impide a un usuario actualizar una invitación que no le pertenece', async () => {
        const invitationId = 'invitation-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'invitations', invitationId),
                    {
                        invitedUserId: 'student-test-001',
                        invitedByUserId: 'teacher-test-001',
                        type: 'group',
                        targetId: 'group-test-001',
                        status: 'pending',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                'student-test-999',
            );

        const db = context.firestore();

        await assertFails(
            updateDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
                {
                    status: 'accepted',
                },
            ),
        );
    });

    it('permite al usuario invitado actualizar el estado de su invitación', async () => {
        const studentId = 'student-test-001';
        const invitationId = 'invitation-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'invitations', invitationId),
                    {
                        invitedUserId: studentId,
                        invitedByUserId: 'teacher-test-001',
                        type: 'group',
                        targetId: 'group-test-001',
                        status: 'pending',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
                {
                    status: 'accepted',
                },
            ),
        );
    });

    it('impide eliminar una invitación', async () => {
        const studentId = 'student-test-001';
        const invitationId = 'invitation-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'invitations', invitationId),
                    {
                        invitedUserId: studentId,
                        invitedByUserId: 'teacher-test-001',
                        type: 'group',
                        targetId: 'group-test-001',
                        status: 'pending',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentId);

        const db = context.firestore();

        await assertFails(
            deleteDoc(
                doc(
                    db,
                    'invitations',
                    invitationId,
                ),
            ),
        );
    });
});