import type { Timestamp } from 'firebase/firestore';

export interface BaseDocument {
    id: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export type FirestoreTimestamp = Timestamp;