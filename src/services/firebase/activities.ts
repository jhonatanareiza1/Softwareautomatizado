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

export interface UpdateActivityData {
    activityId: string;
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

export interface UpdateActivityResult {
    activityId: string;
    configId: string;
    isPublished: boolean;
}

export interface TeacherActivity {
    id: string;
    title: string;
    description?: string;
    type?: string;
    ownerTeacherId: string;
    subjectId?: string;
    topicId?: string;
    configId?: string;
    isPublished: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface ListTeacherActivitiesResult {
    activities: TeacherActivity[];
}

export interface TeacherActivityQuestion {
    id: string;
    type: string;
    text: string;
    options?: Array<{
        id: string;
        text: string;
    }>;
    points?: number;
    explanation?: string;
}

export interface TeacherActivityConfig {
    id: string;
    activityId: string;
    ownerTeacherId: string;
    questions: TeacherActivityQuestion[];
    timeLimitSeconds?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    passingScore?: number;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface TeacherActivityAnswerKey {
    id: string;
    activityId: string;
    ownerTeacherId: string;
    answers: Record<
        string,
        string | string[]
    >;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface TeacherActivityDetail {
    id: string;
    title: string;
    description?: string;
    type: string;
    ownerTeacherId: string;
    subjectId?: string;
    topicId?: string;
    configId: string;
    isPublished: boolean;
    createdAt?: unknown;
    updatedAt?: unknown;
}

export interface GetTeacherActivityResult {
    activity: TeacherActivityDetail;
    config: TeacherActivityConfig;
    answerKey: TeacherActivityAnswerKey;
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

export interface ActivityAttempt {
    attemptId: string;
    studentId: string;
    activityId: string;
    groupId?: string;

    score: number;
    totalPoints: number;

    correctAnswers: number;
    totalQuestions: number;

    passed: boolean;
    status: string;

    gamification?: {
        scorePercentage?: number;
        xp?: number;
        coins?: number;
        totalXP?: number;
        totalCoins?: number;
        rewarded?: boolean;
    };

    createdAt?: unknown;
}

export interface ListActivityAttemptsResult {
    attempts: ActivityAttempt[];
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

export async function updateActivity(
    data: UpdateActivityData,
): Promise<UpdateActivityResult> {
    const updateActivityCallable = httpsCallable<
        UpdateActivityData,
        UpdateActivityResult
    >(
        firebaseFunctions,
        'updateActivity',
    );

    const result: HttpsCallableResult<
        UpdateActivityResult
    > =
        await updateActivityCallable(data);

    return result.data;
}

export async function listTeacherActivities(): Promise<
    ListTeacherActivitiesResult
> {
    const listTeacherActivitiesCallable =
        httpsCallable<
            undefined,
            ListTeacherActivitiesResult
        >(
            firebaseFunctions,
            'listTeacherActivities',
        );

    const result: HttpsCallableResult<
        ListTeacherActivitiesResult
    > =
        await listTeacherActivitiesCallable(
            undefined,
        );

    return result.data;
}

export async function getTeacherActivity(
    activityId: string,
): Promise<GetTeacherActivityResult> {
    const getTeacherActivityCallable =
        httpsCallable<
            GetActivityData,
            GetTeacherActivityResult
        >(
            firebaseFunctions,
            'getTeacherActivity',
        );

    const result: HttpsCallableResult<
        GetTeacherActivityResult
    > =
        await getTeacherActivityCallable({
            activityId,
        });

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

export async function listActivityAttempts(
    activityId: string,
): Promise<ListActivityAttemptsResult> {
    const listActivityAttemptsCallable =
        httpsCallable<
            GetActivityData,
            ListActivityAttemptsResult
        >(
            firebaseFunctions,
            'listActivityAttempts',
        );

    const result: HttpsCallableResult<
        ListActivityAttemptsResult
    > =
        await listActivityAttemptsCallable({
            activityId,
        });

    return result.data;
}