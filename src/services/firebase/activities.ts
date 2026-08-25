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
} from '../../types';

interface GetActivityData {
    activityId: string;
}

interface GetActivityResult {
    activity: Activity;
    config: ActivityConfig;
}

interface SubmitAttemptData {
    activityId: string;
    studentId: string;
    groupId?: string;
    answers: Record<string, string | string[]>;
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
