import type { Timestamp } from 'firebase/firestore';

export interface Grade {
    id: string;
    studentId: string;
    teacherId: string;
    groupId: string;
    subjectId: string;
    activityId: string;

    grade: number;
    baseGrade: number;
    academicBonus: number;
    finalGrade: number;

    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface GradeChange {
    id: string;
    gradeId: string;
    studentId: string;
    changedBy: string;

    previousGrade: number;
    newGrade: number;

    type: 'grade' | 'academic_bonus';
    reason: string;

    achievementId: string | null;
    bonus: number;

    createdAt: Timestamp;
}
