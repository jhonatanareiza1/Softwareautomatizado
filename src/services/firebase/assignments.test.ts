import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

const httpsCallableMock =
    vi.hoisted(() => vi.fn());

vi.mock(
    'firebase/functions',
    () => ({
        httpsCallable:
            httpsCallableMock,
    }),
);

vi.mock(
    './config',
    () => ({
        firebaseFunctions: {},
    }),
);

import {
    completeActivityAssignment,
    createActivityAssignment,
    getStudentAssignments,
    getTeacherAssignments,
    updateActivityAssignment,
} from './assignments';

describe(
    'assignments service',
    () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it(
            'obtiene las asignaciones del estudiante',
            async () => {
                const assignments = [
                    {
                        id: 'assignment-001',
                        activityId: 'activity-001',
                        assignedBy: 'teacher-001',
                        targetType: 'student' as const,
                        targetId: 'student-001',
                        dueAt: null,
                        status: 'assigned',
                        createdAt: null,
                    },
                ];

                const callable =
                    vi.fn().mockResolvedValue({
                        data: {
                            success: true,
                            assignments,
                        },
                    });

                httpsCallableMock.mockReturnValue(
                    callable,
                );

                const result =
                    await getStudentAssignments(
                        'student-001',
                    );

                expect(
                    httpsCallableMock,
                ).toHaveBeenCalledWith(
                    expect.anything(),
                    'getStudentAssignments',
                );

                expect(
                    callable,
                ).toHaveBeenCalledWith({
                    studentId:
                        'student-001',
                });

                expect(result).toEqual(
                    assignments,
                );
            },
        );

        it(
            'crea una asignación',
            async () => {
                const response = {
                    success: true as const,
                    assignmentId:
                        'assignment-001',
                    activityId:
                        'activity-001',
                    assignedBy:
                        'teacher-001',
                    targetType:
                        'student' as const,
                    targetId:
                        'student-001',
                    dueAt:
                        null,
                };

                const callable =
                    vi.fn().mockResolvedValue({
                        data: response,
                    });

                httpsCallableMock.mockReturnValue(
                    callable,
                );

                const data = {
                    activityId:
                        'activity-001',
                    targetType:
                        'student' as const,
                    targetId:
                        'student-001',
                    dueAt:
                        null,
                };

                const result =
                    await createActivityAssignment(
                        data,
                    );

                expect(
                    httpsCallableMock,
                ).toHaveBeenCalledWith(
                    expect.anything(),
                    'createActivityAssignment',
                );

                expect(
                    callable,
                ).toHaveBeenCalledWith(
                    data,
                );

                expect(result).toEqual(
                    response,
                );
            },
        );

        it(
            'obtiene las asignaciones del docente',
            async () => {
                const assignments = [
                    {
                        id: 'assignment-001',
                        activityId: 'activity-001',
                        assignedBy: 'teacher-001',
                        targetType: 'group' as const,
                        targetId: 'group-001',
                        dueAt: null,
                        status: 'assigned',
                        createdAt: null,
                    },
                ];

                const callable =
                    vi.fn().mockResolvedValue({
                        data: {
                            success: true,
                            assignments,
                        },
                    });

                httpsCallableMock.mockReturnValue(
                    callable,
                );

                const result =
                    await getTeacherAssignments();

                expect(
                    httpsCallableMock,
                ).toHaveBeenCalledWith(
                    expect.anything(),
                    'getTeacherAssignments',
                );

                expect(
                    callable,
                ).toHaveBeenCalledWith({});

                expect(result).toEqual(
                    assignments,
                );
            },
        );

        it(
            'actualiza una asignación',
            async () => {
                const response = {
                    success: true as const,
                    assignmentId:
                        'assignment-001',
                    dueAt:
                        null,
                    status:
                        'cancelled',
                };

                const callable =
                    vi.fn().mockResolvedValue({
                        data: response,
                    });

                httpsCallableMock.mockReturnValue(
                    callable,
                );

                const data = {
                    assignmentId:
                        'assignment-001',
                    status:
                        'cancelled' as const,
                };

                const result =
                    await updateActivityAssignment(
                        data,
                    );

                expect(
                    httpsCallableMock,
                ).toHaveBeenCalledWith(
                    expect.anything(),
                    'updateActivityAssignment',
                );

                expect(
                    callable,
                ).toHaveBeenCalledWith(
                    data,
                );

                expect(result).toEqual(
                    response,
                );
            },
        );

        it(
            'completa una asignación',
            async () => {
                const response = {
                    success: true as const,
                    assignmentId:
                        'assignment-001',
                    studentId:
                        'student-001',
                    status:
                        'completed',
                };

                const callable =
                    vi.fn().mockResolvedValue({
                        data: response,
                    });

                httpsCallableMock.mockReturnValue(
                    callable,
                );

                const data = {
                    assignmentId:
                        'assignment-001',
                    studentId:
                        'student-001',
                };

                const result =
                    await completeActivityAssignment(
                        data,
                    );

                expect(
                    httpsCallableMock,
                ).toHaveBeenCalledWith(
                    expect.anything(),
                    'completeActivityAssignment',
                );

                expect(
                    callable,
                ).toHaveBeenCalledWith(
                    data,
                );

                expect(result).toEqual(
                    response,
                );
            },
        );
    },
);