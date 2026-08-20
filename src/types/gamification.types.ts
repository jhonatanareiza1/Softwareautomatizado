import type { BaseDocument, FirestoreTimestamp } from './common.types';

export type SubjectKey =
    | 'mathematics'
    | 'english'
    | 'science'
    | 'history';

export interface SubjectProgress {
    percentage: number;
    level: number;
    label: 'Básico' | 'Intermedio' | 'Avanzado';
}

export interface GamificationProfile extends BaseDocument {
    studentId: string;

    totalXP: number;
    level: number;
    coins: number;

    currentStreak: number;
    bestStreak: number;

    subjects: Record<SubjectKey, SubjectProgress>;

    lastActivityAt: FirestoreTimestamp | null;
}