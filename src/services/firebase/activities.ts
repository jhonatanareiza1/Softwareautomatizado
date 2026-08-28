import {
    httpsCallable,
    type HttpsCallableResult,
} from 'firebase/functions';

import {
    firebaseFunctions,
} from './config';

import type {
    Activity,
    ActivityConfig,
    ActivityType,
    QuestionType,
} from '../../types';

interface GetActivityData {
    activityId: string;
}

interface GetActivityResult {
    activity: Activity;
    config: ActivityConfig;
}

interface CreateActivityOption {
    id: string;
    text: string;
}

interface CreateActivityQuestion {
    id?: string;
    type: QuestionType;
    text: string;
    options?: CreateActivityOption[];
    points?: number;
    correctAnswer: string | string[];
    explanation?: string;
}

export interface CreateActivityData {
    title: string;
    description?: string;
    type: ActivityType;
    subjectId: string;
    topicId?: string;
    questions: CreateActivityQuestion[];
    timeLimitSeconds?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    passingScore?: number;
    isPublished?: boolean;
}

export interface CreateActivityResult {
    activityId: string;
    configId: string;
    isPublished: boolean;
}

interface SubmitAttemptData {
    activityId: string;
    studentId: string;
    groupId?: string;
    attemptId?: string;
    answers: Record<string, string | string[]>;
}

interface SubmitAttemptGamification {
    scorePercentage: number;
    xp: number;
    totalXP: number;
    coins: number;
    totalCoins: number;
    rewarded: boolean;
}

export interface SubmitAttemptResult {
    success: boolean;
    attemptId: string;

    activity: {
        id: string;
        title: string;
    };

    score: number;
    totalPoints: number;

    correctAnswers: number;
    totalQuestions: number;

    passed: boolean;

    gamification: SubmitAttemptGamification;
}

export async function createActivity(
    data: CreateActivityData,
): Promise<CreateActivityResult> {
    const createActivityCallable = httpsCallable<
        CreateActivityData,
        CreateActivityResult
    >(
        firebaseFunctions,
        'createActivity',
    );

    const result: HttpsCallableResult<
        CreateActivityResult
    > = await createActivityCallable(data);

    return result.data;
}

export async function getActivity(
    activityId: string,
): Promise<GetActivityResult> {
    const getActivityCallable = httpsCallable<
        GetActivityData,
        GetActivityResult
    >(
        firebaseFunctions,
        'getActivity',
    );

    const result: HttpsCallableResult<
        GetActivityResult
    > = await getActivityCallable({
        activityId,
    });

    return result.data;
}

export async function submitAttempt(
    data: SubmitAttemptData,
): Promise<SubmitAttemptResult> {
    const submitAttemptCallable = httpsCallable<
        SubmitAttemptData,
        SubmitAttemptResult
    >(
        firebaseFunctions,
        'submitAttempt',
    );

    const result: HttpsCallableResult<
        SubmitAttemptResult
    > = await submitAttemptCallable(data);

    return result.data;
}
