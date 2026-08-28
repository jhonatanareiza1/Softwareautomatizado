import {
    httpsCallable,
    type HttpsCallableResult,
} from 'firebase/functions';

import {
    firebaseFunctions,
} from './config';

export interface StudentActivity {
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

interface ListStudentActivitiesResult {
    activities: StudentActivity[];
}

export async function getStudentActivities(): Promise<
    StudentActivity[]
> {
    const callable =
        httpsCallable<
            Record<string, never>,
            ListStudentActivitiesResult
        >(
            firebaseFunctions,
            'listStudentActivities',
        );

    const result:
        HttpsCallableResult<
            ListStudentActivitiesResult
        > =
        await callable({});

    return result.data.activities;
}
