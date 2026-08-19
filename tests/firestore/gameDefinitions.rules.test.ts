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

describe('Firestore Security Rules - gameDefinitions', () => {
    it('permite a un usuario autenticado leer una definición de juego', async () => {
        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                await setDoc(
                    doc(
                        context.firestore(),
                        'gameDefinitions',
                        'game-definition-test-001',
                    ),
                    {
                        title: 'Juego de prueba',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                'student-test-001',
            );

        await assertSucceeds(
            getDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
            ),
        );
    });

    it('impide a un usuario no autenticado leer una definición de juego', async () => {
        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                await setDoc(
                    doc(
                        context.firestore(),
                        'gameDefinitions',
                        'game-definition-test-001',
                    ),
                    {
                        title: 'Juego de prueba',
                        ownerTeacherId: 'teacher-test-001',
                    },
                );
            },
        );

        const context =
            testEnv.unauthenticatedContext();

        await assertFails(
            getDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
            ),
        );
    });

    it('permite a un docente crear una definición de juego propia', async () => {
        const teacherId = 'teacher-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                await setDoc(
                    doc(
                        context.firestore(),
                        'users',
                        teacherId,
                    ),
                    {
                        uid: teacherId,
                        role: 'teacher',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                teacherId,
            );

        await assertSucceeds(
            setDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
                {
                    title: 'Juego de prueba',
                    ownerTeacherId: teacherId,
                },
            ),
        );
    });

    it('impide a un estudiante crear una definición de juego', async () => {
        const studentId = 'student-test-001';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                await setDoc(
                    doc(
                        context.firestore(),
                        'users',
                        studentId,
                    ),
                    {
                        uid: studentId,
                        role: 'student',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                studentId,
            );

        await assertFails(
            setDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
                {
                    title: 'Juego no permitido',
                    ownerTeacherId: studentId,
                },
            ),
        );
    });

    it('impide a un docente crear una definición de juego perteneciente a otro docente', async () => {
        const teacherId = 'teacher-test-001';
        const otherTeacherId = 'teacher-test-002';

        await testEnv.withSecurityRulesDisabled(
            async (context) => {
                await setDoc(
                    doc(
                        context.firestore(),
                        'users',
                        teacherId,
                    ),
                    {
                        uid: teacherId,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(
                        context.firestore(),
                        'users',
                        otherTeacherId,
                    ),
                    {
                        uid: otherTeacherId,
                        role: 'teacher',
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                teacherId,
            );

        await assertFails(
            setDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
                {
                    title: 'Juego ajeno',
                    ownerTeacherId: otherTeacherId,
                },
            ),
        );
    });

    it('permite al docente propietario actualizar una definición de juego', async () => {
        const teacherId = 'teacher-test-001';

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
                    doc(
                        db,
                        'gameDefinitions',
                        'game-definition-test-001',
                    ),
                    {
                        title: 'Juego original',
                        ownerTeacherId: teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                teacherId,
            );

        await assertSucceeds(
            updateDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
                {
                    title: 'Juego actualizado',
                },
            ),
        );
    });

    it('impide a un docente modificar una definición de juego de otro docente', async () => {
        const teacherId = 'teacher-test-001';
        const ownerId = 'teacher-test-002';

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
                    doc(db, 'users', ownerId),
                    {
                        uid: ownerId,
                        role: 'teacher',
                    },
                );

                await setDoc(
                    doc(
                        db,
                        'gameDefinitions',
                        'game-definition-test-001',
                    ),
                    {
                        title: 'Juego ajeno',
                        ownerTeacherId: ownerId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                teacherId,
            );

        await assertFails(
            updateDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
                {
                    title: 'Intento de modificación',
                },
            ),
        );
    });

    it('impide cambiar el propietario de una definición de juego', async () => {
        const teacherId = 'teacher-test-001';
        const otherTeacherId = 'teacher-test-002';

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

                await setDoc(
                    doc(
                        db,
                        'gameDefinitions',
                        'game-definition-test-001',
                    ),
                    {
                        title: 'Juego original',
                        ownerTeacherId: teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                teacherId,
            );

        await assertFails(
            updateDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
                {
                    ownerTeacherId: otherTeacherId,
                },
            ),
        );
    });

    it('impide eliminar una definición de juego', async () => {
        const teacherId = 'teacher-test-001';

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
                    doc(
                        db,
                        'gameDefinitions',
                        'game-definition-test-001',
                    ),
                    {
                        title: 'Juego',
                        ownerTeacherId: teacherId,
                    },
                );
            },
        );

        const context =
            testEnv.authenticatedContext(
                teacherId,
            );

        await assertFails(
            deleteDoc(
                doc(
                    context.firestore(),
                    'gameDefinitions',
                    'game-definition-test-001',
                ),
            ),
        );
    });
});
