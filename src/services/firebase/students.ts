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
    Student,
    StudentCreateData,
    StudentUpdateData,
} from '../../types';

const STUDENTS_COLLECTION = 'students';

function mapStudent(
    id: string,
    data: Record<string, unknown>,
): Student {
    return {
        id,
        userId: data.userId as string,

        firstName: data.firstName as string,
        lastName: data.lastName as string,

        birthYear:
            (data.birthYear as number | null) ?? null,

        avatarId:
            (data.avatarId as string | null) ?? null,

        schoolName:
            (data.schoolName as string | null) ?? null,

        status:
            data.status as Student['status'],

        createdAt:
            data.createdAt as Student['createdAt'],

        updatedAt:
            data.updatedAt as Student['updatedAt'],
    };
}

export async function getStudent(
    studentId: string,
): Promise<Student | null> {
    const studentRef = doc(
        firestoreDb,
        STUDENTS_COLLECTION,
        studentId,
    );

    const snapshot = await getDoc(studentRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapStudent(
        snapshot.id,
        snapshot.data(),
    );
}

export async function getStudentByUserId(
    userId: string,
): Promise<Student | null> {
    const studentsRef = collection(
        firestoreDb,
        STUDENTS_COLLECTION,
    );

    const studentQuery = query(
        studentsRef,
        where('userId', '==', userId),
        limit(1),
    );

    const snapshot =
        await getDocs(studentQuery);

    if (snapshot.empty) {
        return null;
    }

    const document =
        snapshot.docs[0];

    return mapStudent(
        document.id,
        document.data(),
    );
}

export async function createStudent(
    data: StudentCreateData,
): Promise<string> {
    const studentRef = doc(
        collection(
            firestoreDb,
            STUDENTS_COLLECTION,
        ),
    );

    await setDoc(studentRef, {
        ...data,
        birthYear:
            data.birthYear ?? null,
        avatarId:
            data.avatarId ?? null,
        schoolName:
            data.schoolName ?? null,
        createdAt:
            serverTimestamp(),
        updatedAt:
            serverTimestamp(),
    });

    return studentRef.id;
}

export async function updateStudent(
    studentId: string,
    data: StudentUpdateData,
): Promise<void> {
    const studentRef = doc(
        firestoreDb,
        STUDENTS_COLLECTION,
        studentId,
    );

    await updateDoc(studentRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function deleteStudent(
    studentId: string,
): Promise<void> {
    const studentRef = doc(
        firestoreDb,
        STUDENTS_COLLECTION,
        studentId,
    );

    await deleteDoc(studentRef);
}