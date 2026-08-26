import {
    doc,
    getDoc,
} from 'firebase/firestore';

import {
    firestoreDb,
} from './config';

import type {
    StudentProgress,
    StudentSubjectProgress,
} from '../../types';

const emptySubjectProgress: StudentSubjectProgress = {
    activitiesCompleted: 0,
    passedActivities: 0,
    totalScore: 0,
    totalPoints: 0,
    percentage: 0,
};

function normalizeSubjectProgress(
    value: unknown,
): StudentSubjectProgress {
    if (
        !value ||
        typeof value !== 'object' ||
        Array.isArray(value)
    ) {
        return {
            ...emptySubjectProgress,
        };
    }

    const data =
        value as Record<string, unknown>;

    return {
        activitiesCompleted:
            typeof data.activitiesCompleted === 'number'
                ? data.activitiesCompleted
                : 0,

        passedActivities:
            typeof data.passedActivities === 'number'
                ? data.passedActivities
                : 0,

        totalScore:
            typeof data.totalScore === 'number'
                ? data.totalScore
                : 0,

        totalPoints:
            typeof data.totalPoints === 'number'
                ? data.totalPoints
                : 0,

        percentage:
            typeof data.percentage === 'number'
                ? data.percentage
                : 0,

        ...(typeof data.lastActivityId === 'string'
            ? {
                lastActivityId:
                    data.lastActivityId,
            }
            : {}),

        ...(typeof data.lastScore === 'number'
            ? {
                lastScore:
                    data.lastScore,
            }
            : {}),

        ...(typeof data.lastPercentage === 'number'
            ? {
                lastPercentage:
                    data.lastPercentage,
            }
            : {}),

        ...(typeof data.lastPassed === 'boolean'
            ? {
                lastPassed:
                    data.lastPassed,
            }
            : {}),
    };
}

export async function getStudentProgress(
    studentId: string,
): Promise<StudentProgress | null> {
    if (!studentId.trim()) {
        throw new Error(
            'studentId es obligatorio.',
        );
    }

    const progressReference =
        doc(
            firestoreDb,
            'progress',
            studentId,
        );

    const snapshot =
        await getDoc(progressReference);

    if (!snapshot.exists()) {
        return null;
    }

    const data =
        snapshot.data();

    const subjects =
        data.subjects &&
            typeof data.subjects === 'object' &&
            !Array.isArray(data.subjects)
            ? data.subjects as Record<string, unknown>
            : {};

    return {
        studentId:
            typeof data.studentId === 'string'
                ? data.studentId
                : studentId,

        subjects: {
            mathematics:
                normalizeSubjectProgress(
                    subjects.mathematics,
                ),

            english:
                normalizeSubjectProgress(
                    subjects.english,
                ),

            science:
                normalizeSubjectProgress(
                    subjects.science,
                ),

            history:
                normalizeSubjectProgress(
                    subjects.history,
                ),
        },

        ...(data.createdAt !== undefined
            ? {
                createdAt:
                    data.createdAt,
            }
            : {}),

        ...(data.updatedAt !== undefined
            ? {
                updatedAt:
                    data.updatedAt,
            }
            : {}),
    };
}

export async function getProgressByStudentId(
    studentId: string,
): Promise<StudentProgress | null> {
    return getStudentProgress(studentId);
}
