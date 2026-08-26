export type ProgressSubjectKey =
    | 'mathematics'
    | 'english'
    | 'science'
    | 'history';

export interface StudentSubjectProgress {
    activitiesCompleted: number;
    passedActivities: number;
    totalScore: number;
    totalPoints: number;
    percentage: number;
    lastActivityId?: string;
    lastScore?: number;
    lastPercentage?: number;
    lastPassed?: boolean;
}

export interface StudentProgress {
    studentId: string;
    subjects: Record<
        ProgressSubjectKey,
        StudentSubjectProgress
    >;
    createdAt?: unknown;
    updatedAt?: unknown;
}
