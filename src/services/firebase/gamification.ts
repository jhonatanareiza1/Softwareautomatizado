import {
    collection,
    getDocs,
    limit,
    query,
    where,
} from 'firebase/firestore';

import {
    httpsCallable,
    type HttpsCallableResult,
} from 'firebase/functions';

import {
    firebaseFunctions,
    firestoreDb,
} from './config';

import type {
    GamificationProfile,
    SubjectKey,
    SubjectProgress,
} from '../../types';


const GAMIFICATION_PROFILES_COLLECTION =
    'gamificationProfiles';

interface InitializeGamificationProfileData {
    studentId: string;
}

interface InitializeGamificationProfileResult {
    studentId: string;
    created: boolean;
}

function mapSubjectProgress(
    data: Record<string, unknown>,
): Record<SubjectKey, SubjectProgress> {
    return {
        mathematics:
            data.mathematics as SubjectProgress,
        english:
            data.english as SubjectProgress,
        science:
            data.science as SubjectProgress,
        history:
            data.history as SubjectProgress,
    };
}

function mapGamificationProfile(
    id: string,
    data: Record<string, unknown>,
): GamificationProfile {
    return {
        id,
        studentId: data.studentId as string,

        totalXP: data.totalXP as number,
        level: data.level as number,
        coins: data.coins as number,

        currentStreak:
            data.currentStreak as number,

        bestStreak:
            data.bestStreak as number,

        subjects: mapSubjectProgress(
            data.subjects as Record<string, unknown>,
        ),

        lastActivityAt:
            (data.lastActivityAt as GamificationProfile['lastActivityAt'])
            ?? null,

        createdAt:
            data.createdAt as GamificationProfile['createdAt'],

        updatedAt:
            data.updatedAt as GamificationProfile['updatedAt'],
    };
}

export async function getGamificationProfileByStudentId(
    studentId: string,
): Promise<GamificationProfile | null> {
    const profilesReference = collection(
        firestoreDb,
        GAMIFICATION_PROFILES_COLLECTION,
    );

    const profileQuery = query(
        profilesReference,
        where('studentId', '==', studentId),
        limit(1),
    );

    const snapshot = await getDocs(profileQuery);

    if (snapshot.empty) {
        return null;
    }

    const profileDocument = snapshot.docs[0];

    return mapGamificationProfile(
        profileDocument.id,
        profileDocument.data(),
    );
}

export async function initializeGamificationProfile(
    studentId: string,
): Promise<InitializeGamificationProfileResult> {
    const initializeProfile = httpsCallable<
        InitializeGamificationProfileData,
        InitializeGamificationProfileResult
    >(
        firebaseFunctions,
        'initializeGamificationProfile',
    );

    const result: HttpsCallableResult<
        InitializeGamificationProfileResult
    > = await initializeProfile({
        studentId,
    });

    return result.data;
}