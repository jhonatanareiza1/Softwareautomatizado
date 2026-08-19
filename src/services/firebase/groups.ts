import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where,
} from 'firebase/firestore';

import { firestoreDb } from './config';

import type {
    Group,
    GroupCreateData,
    GroupUpdateData,
    GroupMember,
    GroupMemberCreateData,
    GroupMemberUpdateData,
    GroupTeacher,
    GroupTeacherCreateData,
    GroupTeacherUpdateData,
} from '../../types';

const GROUPS_COLLECTION = 'groups';
const GROUP_MEMBERS_COLLECTION =
    'groupMembers';
const GROUP_TEACHERS_COLLECTION =
    'groupTeachers';

function mapGroup(
    id: string,
    data: Record<string, unknown>,
): Group {
    return {
        id,

        name:
            data.name as string,

        description:
            (data.description as string | null) ??
            null,

        schoolName:
            (data.schoolName as string | null) ??
            null,

        ownerTeacherId:
            data.ownerTeacherId as string,

        status:
            data.status as Group['status'],

        createdAt:
            data.createdAt as Group['createdAt'],

        updatedAt:
            data.updatedAt as Group['updatedAt'],
    };
}

function mapGroupMember(
    id: string,
    data: Record<string, unknown>,
): GroupMember {
    return {
        id,

        groupId:
            data.groupId as string,

        studentId:
            data.studentId as string,

        status:
            data.status as GroupMember['status'],

        joinedAt:
            data.joinedAt as GroupMember['joinedAt'],

        leftAt:
            (data.leftAt as GroupMember['leftAt']) ??
            null,

        createdAt:
            data.createdAt as GroupMember['createdAt'],

        updatedAt:
            data.updatedAt as GroupMember['updatedAt'],
    };
}

function mapGroupTeacher(
    id: string,
    data: Record<string, unknown>,
): GroupTeacher {
    return {
        id,

        groupId:
            data.groupId as string,

        teacherId:
            data.teacherId as string,

        role:
            data.role as GroupTeacher['role'],

        status:
            data.status as GroupTeacher['status'],

        assignedAt:
            data.assignedAt as GroupTeacher['assignedAt'],

        createdAt:
            data.createdAt as GroupTeacher['createdAt'],

        updatedAt:
            data.updatedAt as GroupTeacher['updatedAt'],
    };
}

export async function getGroup(
    groupId: string,
): Promise<Group | null> {
    const groupRef = doc(
        firestoreDb,
        GROUPS_COLLECTION,
        groupId,
    );

    const snapshot =
        await getDoc(groupRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapGroup(
        snapshot.id,
        snapshot.data(),
    );
}

export async function createGroup(
    data: GroupCreateData,
): Promise<string> {
    const groupRef = doc(
        collection(
            firestoreDb,
            GROUPS_COLLECTION,
        ),
    );

    await setDoc(groupRef, {
        ...data,
        description:
            data.description ?? null,
        schoolName:
            data.schoolName ?? null,
        createdAt:
            serverTimestamp(),
        updatedAt:
            serverTimestamp(),
    });

    return groupRef.id;
}

export async function updateGroup(
    groupId: string,
    data: GroupUpdateData,
): Promise<void> {
    const groupRef = doc(
        firestoreDb,
        GROUPS_COLLECTION,
        groupId,
    );

    await updateDoc(groupRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function deleteGroup(
    groupId: string,
): Promise<void> {
    const groupRef = doc(
        firestoreDb,
        GROUPS_COLLECTION,
        groupId,
    );

    await deleteDoc(groupRef);
}

export async function getGroupMembers(
    groupId: string,
): Promise<GroupMember[]> {
    const membersRef = collection(
        firestoreDb,
        GROUP_MEMBERS_COLLECTION,
    );

    const membersQuery = query(
        membersRef,
        where(
            'groupId',
            '==',
            groupId,
        ),
    );

    const snapshot =
        await getDocs(membersQuery);

    return snapshot.docs.map(
        (document) =>
            mapGroupMember(
                document.id,
                document.data(),
            ),
    );
}

export async function addGroupMember(
    data: GroupMemberCreateData,
): Promise<string> {
    const memberId =
        `${data.groupId}_${data.studentId}`;

    const memberRef = doc(
        firestoreDb,
        GROUP_MEMBERS_COLLECTION,
        memberId,
    );

    await setDoc(memberRef, {
        ...data,
        leftAt: data.leftAt ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return memberId;
}

export async function updateGroupMember(
    memberId: string,
    data: GroupMemberUpdateData,
): Promise<void> {
    const memberRef = doc(
        firestoreDb,
        GROUP_MEMBERS_COLLECTION,
        memberId,
    );

    await updateDoc(memberRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function removeGroupMember(
    memberId: string,
): Promise<void> {
    const memberRef = doc(
        firestoreDb,
        GROUP_MEMBERS_COLLECTION,
        memberId,
    );

    await deleteDoc(memberRef);
}

export async function getGroupTeachers(
    groupId: string,
): Promise<GroupTeacher[]> {
    const teachersRef = collection(
        firestoreDb,
        GROUP_TEACHERS_COLLECTION,
    );

    const teachersQuery = query(
        teachersRef,
        where(
            'groupId',
            '==',
            groupId,
        ),
    );

    const snapshot =
        await getDocs(teachersQuery);

    return snapshot.docs.map(
        (document) =>
            mapGroupTeacher(
                document.id,
                document.data(),
            ),
    );
}

export async function addGroupTeacher(
    data: GroupTeacherCreateData,
): Promise<string> {
    const teacherMemberId =
        `${data.groupId}_${data.teacherId}`;

    const teacherRef = doc(
        firestoreDb,
        GROUP_TEACHERS_COLLECTION,
        teacherMemberId,
    );

    await setDoc(teacherRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return teacherMemberId;
}

export async function updateGroupTeacher(
    groupTeacherId: string,
    data: GroupTeacherUpdateData,
): Promise<void> {
    const teacherRef = doc(
        firestoreDb,
        GROUP_TEACHERS_COLLECTION,
        groupTeacherId,
    );

    await updateDoc(teacherRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function removeGroupTeacher(
    groupTeacherId: string,
): Promise<void> {
    const teacherRef = doc(
        firestoreDb,
        GROUP_TEACHERS_COLLECTION,
        groupTeacherId,
    );

    await deleteDoc(teacherRef);
}