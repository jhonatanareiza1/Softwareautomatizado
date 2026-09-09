export type AssignmentTargetType =
    | 'student'
    | 'group';

export type ActivityAssignmentStatus =
    | 'assigned'
    | 'completed'
    | 'cancelled';

export interface StudentAssignment {
    id: string;
    activityId: string;
    assignedBy: string;
    targetType: AssignmentTargetType;
    targetId: string;
    dueAt: Date | null;
    status: string;
    createdAt: Date | null;
}

export interface CreateActivityAssignmentData {
    activityId: string;
    targetType: AssignmentTargetType;
    targetId: string;
    dueAt?: Date | string | null;
}

export interface CreateActivityAssignmentResult {
    success: true;
    assignmentId: string;
    activityId: string;
    assignedBy: string;
    targetType: AssignmentTargetType;
    targetId: string;
    dueAt: Date | null;
}