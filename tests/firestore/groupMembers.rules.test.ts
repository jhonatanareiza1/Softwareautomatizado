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

describe('Firestore Security Rules - groupMembers', () => {
    it('permite a un estudiante leer su propia pertenencia al grupo', async () => {
        const studentId = 'student-test-001';
        const groupId = 'group-test-001';
        const memberId = `${groupId}_${studentId}`;

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
                    doc(db, 'groupMembers', memberId),
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
            getDoc(
                doc(db, 'groupMembers', memberId),
            ),
        );
    });

    it('impide a un estudiante leer la pertenencia de otro estudiante', async () => {
        const studentA = 'student-test-001';
        const studentB = 'student-test-002';
        const groupId = 'group-test-001';
        const memberId = `${groupId}_${studentB}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groupMembers', memberId),
                    {
                        groupId,
                        studentId: studentB,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(studentA);

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'groupMembers', memberId),
            ),
        );
    });

    it('permite a un profesor del grupo leer sus miembros', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const studentId = 'student-test-001';
        const memberId = `${groupId}_${studentId}`;
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
                    doc(db, 'groupTeachers', teacherMemberId),
                    {
                        groupId,
                        teacherId,
                    },
                );

                await setDoc(
                    doc(db, 'groupMembers', memberId),
                    {
                        groupId,
                        studentId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            getDoc(
                doc(db, 'groupMembers', memberId),
            ),
        );
    });

    it('impide a un profesor de otro grupo leer los miembros', async () => {
        const teacherA = 'teacher-test-001';
        const teacherB = 'teacher-test-002';
        const groupId = 'group-test-001';
        const studentId = 'student-test-001';
        const memberId = `${groupId}_${studentId}`;
        const teacherMemberId =
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
                    doc(db, 'groupTeachers', teacherMemberId),
                    {
                        groupId,
                        teacherId: teacherB,
                    },
                );

                await setDoc(
                    doc(db, 'groupMembers', memberId),
                    {
                        groupId,
                        studentId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherA);

        const db = context.firestore();

        await assertFails(
            getDoc(
                doc(db, 'groupMembers', memberId),
            ),
        );
    });

    it('permite a un profesor del grupo crear una pertenencia', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const studentId = 'student-test-001';
        const memberId = `${groupId}_${studentId}`;
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
                    doc(db, 'groupTeachers', teacherMemberId),
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
            setDoc(
                doc(db, 'groupMembers', memberId),
                {
                    groupId,
                    studentId,
                },
            ),
        );
    });

    it('impide a un profesor de otro grupo crear una pertenencia', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const otherGroupId = 'group-test-002';
        const studentId = 'student-test-001';
        const memberId =
            `${otherGroupId}_${studentId}`;
        const teacherMemberId =
            `${groupId}_${teacherId}`;

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
                    doc(db, 'groupTeachers', teacherMemberId),
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
            setDoc(
                doc(db, 'groupMembers', memberId),
                {
                    groupId: otherGroupId,
                    studentId,
                },
            ),
        );
    });

    it('permite a un profesor del grupo actualizar una pertenencia', async () => {
        const teacherId = 'teacher-test-001';
        const groupId = 'group-test-001';
        const studentId = 'student-test-001';
        const memberId = `${groupId}_${studentId}`;
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
                    doc(db, 'groupTeachers', teacherMemberId),
                    {
                        groupId,
                        teacherId,
                    },
                );

                await setDoc(
                    doc(db, 'groupMembers', memberId),
                    {
                        groupId,
                        studentId,
                        status: 'active',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(teacherId);

        const db = context.firestore();

        await assertSucceeds(
            updateDoc(
                doc(db, 'groupMembers', memberId),
                {
                    status: 'inactive',
                },
            ),
        );
    });

    it('impide a un miembro eliminar su registro', async () => {
        const studentId = 'student-test-001';
        const groupId = 'group-test-001';
        const memberId = `${groupId}_${studentId}`;

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                const db = context.firestore();

                await setDoc(
                    doc(db, 'groupMembers', memberId),
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
            deleteDoc(
                doc(db, 'groupMembers', memberId),
            ),
        );
    });
});