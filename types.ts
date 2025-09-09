
import { Timestamp } from 'firebase/firestore';

export interface CustomField {
    id: number;
    name: string;
    value: string;
}

export interface CbtEntry {
    id: string;
    timestamp: Timestamp;
    situation: string;
    mood: string;
    rating: number;
    negativeThought: string;
    evidenceFor?: string;
    evidenceAgainst?: string;
    balancedThought?: string;
    [key: string]: any; // For custom fields like 'custom_sleep'
}

export interface Goal {
    id: string;
    title: string;
    description?: string;
    targetDate?: string;
    status: '進行中' | '達成';
    createdAt: Timestamp;
}

export interface ProgressEntry {
    id: string;
    timestamp: Timestamp;
    text: string;
}

export type View = 'home' | 'journal' | 'dashboard' | 'analytics' | 'pga';
