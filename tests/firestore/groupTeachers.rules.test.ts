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

describe('Firestore Security Rules - groupTeachers', () => {
    it('permite a un profesor leer su propia pertenencia al grupo', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const teacherMemberId = `${groupId}_${teacherId}`;

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
                    doc(
                        db,
                        'groupTeachers',
                        teacherMemberId,
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
            getDoc(
                doc(
                    db,
                    'groupTeachers',
                    teacherMemberId,
                ),
            ),
        );
    });

    it('impide a un profesor leer la pertenencia de otro profesor', async () => {
        const teacherA = 'teacher-test-001';
        const teacherB = 'teacher-test-002';
        const groupId = 'group-test-001';
        const teacherMemberId = `${groupId}_${teacherB}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', teacherA),
                    {
                        uid: teacherA,
                        email: 'teachera@test.com',
                        displayName: 'Teacher A',
                        photoURL: null,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(db, 'users', teacherB),
                    {
                        uid: teacherB,
                        email: 'teacherb@test.com',
                        displayName: 'Teacher B',
                        photoURL: null,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupTeachers',
                        teacherMemberId,
                    ),
                    {
                        groupId,
                        teacherId: teacherB,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherA);

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(
                    db,
                    'groupTeachers',
                    teacherMemberId,
                ),
            ),
        );
    });

    it('permite a un profesor del grupo leer la pertenencia de otro profesor', async () => {
        const teacherA = 'teacher-test-001';
        const teacherB = 'teacher-test-002';
        const groupId = 'group-test-001';

        const teacherAMemberId =
            `${groupId}_${teacherA}`;

        const teacherBMemberId =
            `${groupId}_${teacherB}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', teacherA),
                    {
                        uid: teacherA,
                        email: 'teachera@test.com',
                        displayName: 'Teacher A',
                        photoURL: null,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(db, 'users', teacherB),
                    {
                        uid: teacherB,
                        email: 'teacherb@test.com',
                        displayName: 'Teacher B',
                        photoURL: null,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupTeachers',
                        teacherAMemberId,
                    ),
                    {
                        groupId,
                        teacherId: teacherA,
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'groupTeachers',
                        teacherBMemberId,
                    ),
                    {
                        groupId,
                        teacherId: teacherB,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherA);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(
                    db,
                    'groupTeachers',
                    teacherBMemberId,
                ),
            ),
        );
    });

    it('permite a un profesor crear su propia pertenencia al grupo', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const teacherMemberId = `${groupId}_${teacherId}`;

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
                doc(
                    db,
                    'groupTeachers',
                    teacherMemberId,
                ),
                {
                    groupId,
                    teacherId,
                },
            ),
        );
    });

    it('impide a un profesor crear una pertenencia para otro profesor', async () => {
        const teacherA = 'teacher-test-001';
        const teacherB = 'teacher-test-002';
        const groupId = 'group-test-001';
        const teacherMemberId = `${groupId}_${teacherB}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'users', teacherA),
                    {
                        uid: teacherA,
                        email: 'teachera@test.com',
                        displayName: 'Teacher A',
                        photoURL: null,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(db, 'users', teacherB),
                    {
                        uid: teacherB,
                        email: 'teacherb@test.com',
                        displayName: 'Teacher B',
                        photoURL: null,
                        role: 'teacher',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherA);

        const db = context.firestore();

        await assertFails(
            setDoc(
                doc(
                    db,
                    'groupTeachers',
                    teacherMemberId,
                ),
                {
                    groupId,
                    teacherId: teacherB,
                },
            ),
        );
    });

    it('impide crear una pertenencia con un teacherId diferente al usuario autenticado', async () => {
        const teacherId = 'teacher-test-001';
        const otherTeacherId = 'teacher-test-999';
        const groupId = 'group-test-001';
        const teacherMemberId = `${groupId}_${teacherId}`;

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
                doc(
                    db,
                    'groupTeachers',
                    teacherMemberId,
                ),
                {
                    groupId,
                    teacherId: otherTeacherId,
                },
            ),
        );
    });

    it('impide a un profesor actualizar una pertenencia', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const teacherMemberId = `${groupId}_${teacherId}`;

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
                    doc(
                        db,
                        'groupTeachers',
                        teacherMemberId,
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

        await assertFails(
            updateDoc(
                doc(
                    db,
                    'groupTeachers',
                    teacherMemberId,
                ),
                {
                    groupId: 'group-test-002',
                },
            ),
        );
    });

    it('impide a un profesor eliminar una pertenencia', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const teacherMemberId = `${groupId}_${teacherId}`;

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
                    doc(
                        db,
                        'groupTeachers',
                        teacherMemberId,
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

        await assertFails(
            deleteDoc(
                doc(
                    db,
                    'groupTeachers',
                    teacherMemberId,
                ),
            ),
        );
    });
});