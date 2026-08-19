import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';

import { firestoreDb } from './config';

import type {
    Teacher,
    TeacherCreateData,
    TeacherUpdateData,
} from '../../types';

const TEACHERS_COLLECTION = 'teachers';

function mapTeacher(
    id: string,
    data: Record<string, unknown>,
): Teacher {
    return {
        id,

        userId:
            data.userId as string,

        firstName:
            data.firstName as string,

        lastName:
            data.lastName as string,

        schoolName:
            (data.schoolName as string | null) ??
            null,

        status:
            data.status as Teacher['status'],

        createdAt:
            data.createdAt as Teacher['createdAt'],

        updatedAt:
            data.updatedAt as Teacher['updatedAt'],
    };
}

export async function getTeacher(
    teacherId: string,
): Promise<Teacher | null> {
    const teacherRef = doc(
        firestoreDb,
        TEACHERS_COLLECTION,
        teacherId,
    );

    const snapshot =
        await getDoc(teacherRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapTeacher(
        snapshot.id,
        snapshot.data(),
    );
}

export async function getTeacherByUserId(
    userId: string,
): Promise<Teacher | null> {
    const teachersRef = collection(
        firestoreDb,
        TEACHERS_COLLECTION,
    );

    const teacherQuery = query(
        teachersRef,
        where('userId', '==', userId),
        limit(1),
    );

    const snapshot =
        await getDocs(teacherQuery);

    if (snapshot.empty) {
        return null;
    }

    const document =
        snapshot.docs[0];

    return mapTeacher(
        document.id,
        document.data(),
    );
}

export async function createTeacher(
    data: TeacherCreateData,
): Promise<string> {
    const teacherRef = doc(
        collection(
            firestoreDb,
            TEACHERS_COLLECTION,
        ),
    );

    await setDoc(teacherRef, {
        ...data,
        schoolName:
            data.schoolName ?? null,
        createdAt:
            serverTimestamp(),
        updatedAt:
            serverTimestamp(),
    });

    return teacherRef.id;
}

export async function updateTeacher(
    teacherId: string,
    data: TeacherUpdateData,
): Promise<void> {
    const teacherRef = doc(
        firestoreDb,
        TEACHERS_COLLECTION,
        teacherId,
    );

    await updateDoc(teacherRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function deleteTeacher(
    teacherId: string,
): Promise<void> {
    const teacherRef = doc(
        firestoreDb,
        TEACHERS_COLLECTION,
        teacherId,
    );

    await deleteDoc(teacherRef);
}