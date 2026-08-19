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
    Family,
    FamilyCreateData,
    FamilyUpdateData,
    FamilyMember,
    FamilyMemberCreateData,
    FamilyMemberUpdateData,
} from '../../types';

const FAMILIES_COLLECTION = 'families';
const FAMILY_MEMBERS_COLLECTION =
    'familyMembers';

function mapFamily(
    id: string,
    data: Record<string, unknown>,
): Family {
    return {
        id,

        name:
            data.name as string,

        ownerUserId:
            data.ownerUserId as string,

        createdAt:
            data.createdAt as Family['createdAt'],

        updatedAt:
            data.updatedAt as Family['updatedAt'],
    };
}

function mapFamilyMember(
    id: string,
    data: Record<string, unknown>,
): FamilyMember {
    return {
        id,

        familyId:
            data.familyId as string,

        userId:
            data.userId as string,

        role:
            data.role as FamilyMember['role'],

        status:
            data.status as FamilyMember['status'],

        createdAt:
            data.createdAt as FamilyMember['createdAt'],

        updatedAt:
            data.updatedAt as FamilyMember['updatedAt'],
    };
}

export async function getFamily(
    familyId: string,
): Promise<Family | null> {
    const familyRef = doc(
        firestoreDb,
        FAMILIES_COLLECTION,
        familyId,
    );

    const snapshot =
        await getDoc(familyRef);

    if (!snapshot.exists()) {
        return null;
    }

    return mapFamily(
        snapshot.id,
        snapshot.data(),
    );
}

export async function createFamily(
    data: FamilyCreateData,
): Promise<string> {
    const familyRef = doc(
        collection(
            firestoreDb,
            FAMILIES_COLLECTION,
        ),
    );

    await setDoc(familyRef, {
        ...data,
        createdAt:
            serverTimestamp(),
        updatedAt:
            serverTimestamp(),
    });

    return familyRef.id;
}

export async function updateFamily(
    familyId: string,
    data: FamilyUpdateData,
): Promise<void> {
    const familyRef = doc(
        firestoreDb,
        FAMILIES_COLLECTION,
        familyId,
    );

    await updateDoc(familyRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function deleteFamily(
    familyId: string,
): Promise<void> {
    const familyRef = doc(
        firestoreDb,
        FAMILIES_COLLECTION,
        familyId,
    );

    await deleteDoc(familyRef);
}

export async function getFamilyMembers(
    familyId: string,
): Promise<FamilyMember[]> {
    const membersRef = collection(
        firestoreDb,
        FAMILY_MEMBERS_COLLECTION,
    );

    const membersQuery = query(
        membersRef,
        where(
            'familyId',
            '==',
            familyId,
        ),
    );

    const snapshot =
        await getDocs(membersQuery);

    return snapshot.docs.map(
        (document) =>
            mapFamilyMember(
                document.id,
                document.data(),
            ),
    );
}

export async function addFamilyMember(
    data: FamilyMemberCreateData,
): Promise<string> {
    const memberId = `${data.familyId}_${data.userId}`;

    const memberRef = doc(
        firestoreDb,
        FAMILY_MEMBERS_COLLECTION,
        memberId,
    );

    await setDoc(memberRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    return memberId;
}
export async function updateFamilyMember(
    memberId: string,
    data: FamilyMemberUpdateData,
): Promise<void> {
    const memberRef = doc(
        firestoreDb,
        FAMILY_MEMBERS_COLLECTION,
        memberId,
    );

    await updateDoc(memberRef, {
        ...data,
        updatedAt:
            serverTimestamp(),
    });
}

export async function removeFamilyMember(
    memberId: string,
): Promise<void> {
    const memberRef = doc(
        firestoreDb,
        FAMILY_MEMBERS_COLLECTION,
        memberId,
    );

    await deleteDoc(memberRef);
}