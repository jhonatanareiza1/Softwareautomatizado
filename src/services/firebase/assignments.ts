import {
    httpsCallable,
    type HttpsCallableResult,
} from 'firebase/functions';

import {
    firebaseFunctions,
} from './config';

export type AssignmentTargetType =
    'student'
    | 'group';

export interface StudentAssignment {
    id: string;
    activityId: string;
    assignedBy: string;
    targetType: AssignmentTargetType;
    targetId: string;
    dueAt: unknown | null;
    status: string;
    createdAt: unknown | null;
}

export interface GetStudentAssignmentsResult {
    success: true;
    assignments: StudentAssignment[];
}

export interface CreateActivityAssignmentData {
    activityId: string;
    targetType: AssignmentTargetType;
    targetId: string;
    dueAt?: string | null;
}

export interface CreateActivityAssignmentResult {
    success: true;
    assignmentId: string;
    activityId: string;
    assignedBy: string;
    targetType: AssignmentTargetType;
    targetId: string;
    dueAt: unknown | null;
}

export interface GetTeacherAssignmentsResult {
    success: true;
    assignments: StudentAssignment[];
}

export interface UpdateActivityAssignmentData {
    assignmentId: string;
    dueAt?: string | null;
    status?: 'assigned' | 'cancelled';
}

export interface UpdateActivityAssignmentResult {
    success: true;
    assignmentId: string;
    dueAt: unknown | null;
    status: string;
}

export interface CompleteActivityAssignmentData {
    assignmentId: string;
    studentId: string;
}

export interface CompleteActivityAssignmentResult {
    success: true;
    assignmentId: string;
    studentId: string;
    status: string;
}

export async function getStudentAssignments(
    studentId: string,
): Promise<StudentAssignment[]> {
    const callable =
        httpsCallable<
            {
                studentId: string;
            },
            GetStudentAssignmentsResult
        >(
            firebaseFunctions,
            'getStudentAssignments',
        );

    const result:
        HttpsCallableResult<
            GetStudentAssignmentsResult
        > =
        await callable({
            studentId,
        });

    return result.data.assignments;
}

export async function createActivityAssignment(
    data: CreateActivityAssignmentData,
): Promise<CreateActivityAssignmentResult> {
    const callable =
        httpsCallable<
            CreateActivityAssignmentData,
            CreateActivityAssignmentResult
        >(
            firebaseFunctions,
            'createActivityAssignment',
        );

    const result:
        HttpsCallableResult<
            CreateActivityAssignmentResult
        > =
        await callable(data);

    return result.data;
}

export async function getTeacherAssignments(): Promise<StudentAssignment[]> {
    const callable =
        httpsCallable<
            Record<string, never>,
            GetTeacherAssignmentsResult
        >(
            firebaseFunctions,
            'getTeacherAssignments',
        );

    const result:
        HttpsCallableResult<
            GetTeacherAssignmentsResult
        > =
        await callable({});

    return result.data.assignments;
}

export async function updateActivityAssignment(
    data: UpdateActivityAssignmentData,
): Promise<UpdateActivityAssignmentResult> {
    const callable =
        httpsCallable<
            UpdateActivityAssignmentData,
            UpdateActivityAssignmentResult
        >(
            firebaseFunctions,
            'updateActivityAssignment',
        );

    const result:
        HttpsCallableResult<
            UpdateActivityAssignmentResult
        > =
        await callable(data);

    return result.data;
}

export async function completeActivityAssignment(
    data: CompleteActivityAssignmentData,
): Promise<CompleteActivityAssignmentResult> {
    const callable =
        httpsCallable<
            CompleteActivityAssignmentData,
            CompleteActivityAssignmentResult
        >(
            firebaseFunctions,
            'completeActivityAssignment',
        );

    const result:
        HttpsCallableResult<
            CompleteActivityAssignmentResult
        > =
        await callable(data);

    return result.data;
}