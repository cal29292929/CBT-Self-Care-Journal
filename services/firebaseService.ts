
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    deleteDoc, 
    doc, 
    writeBatch, 
    updateDoc, 
    Timestamp, 
    getDocs
} from 'firebase/firestore';
import { firebaseConfig, appId } from '../config';
import { CbtEntry, Goal, ProgressEntry } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Handle Anonymous Sign-In
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        try {
            await signInAnonymously(auth);
        } catch (error) {
            console.error("Anonymous sign-in failed:", error);
        }
    }
});

// --- CBT Entries ---

export const onCbtEntriesSnapshot = (
    userId: string, 
    callback: (entries: CbtEntry[]) => void, 
    onError: (error: Error) => void
) => {
    const entriesRef = collection(db, `users/${userId}/cbtEntries`);
    const q = query(entriesRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
        const fetchedEntries: CbtEntry[] = [];
        querySnapshot.forEach((doc) => {
            fetchedEntries.push({ id: doc.id, ...doc.data() } as CbtEntry);
        });
        callback(fetchedEntries);
    }, (error) => {
        onError(error);
    });
};

export const addCbtEntry = async (userId: string, entryData: Omit<CbtEntry, 'id' | 'timestamp'> & { timestamp: Date }) => {
    const entriesRef = collection(db, `users/${userId}/cbtEntries`);
    await addDoc(entriesRef, entryData);
};

export const deleteCbtEntry = async (userId: string, entryId: string) => {
    const entryRef = doc(db, `users/${userId}/cbtEntries`, entryId);
    await deleteDoc(entryRef);
};

export const addDummyEntries = async (userId: string) => {
    const dummyEntries = [
        { situation: '朝の通勤電車が遅れた', mood: 'イライラ', rating: 2, negativeThought: '今日は最悪な日になりそうだ', evidenceFor: '電車が遅れて会議に間に合わないかもしれない', evidenceAgainst: '会議はまだ始まっていないし、連絡はしてある', balancedThought: '電車の遅延は自分のせいじゃない。落ち着いて今できることに集中しよう。', custom_睡眠時間: '6時間', custom_運動: 'なし'},
        { situation: '上司から厳しいフィードバックを受けた', mood: '落ち込み', rating: 1, negativeThought: '自分は仕事ができない人間だ', evidenceFor: '上司は具体的な改善点をいくつも指摘した', evidenceAgainst: '上司は私の成長を期待してアドバイスをくれた。他のプロジェクトでは成功もしている。', balancedThought: 'フィードバックは成長の機会。改善点を明確にして、次につなげよう。', custom_睡眠時間: '7時間', custom_運動: 'ウォーキング'},
        { situation: '友人からのメッセージに返信が来ない', mood: '不安', rating: 2, negativeThought: '私、何か悪いこと言ったかな？嫌われたのかもしれない。', evidenceFor: '最後のメッセージから数時間経っている', evidenceAgainst: '友人はただ忙しいだけかもしれないし、返信が遅いことはよくある。', balancedThought: '相手の状況を勝手に想像して不安になるのはやめよう。気長に待ってみよう。', custom_睡眠時間: '8時間', custom_運動: 'なし'},
        { situation: 'プレゼンテーションで緊張して言葉に詰まった', mood: '恥ずかしい', rating: 2, negativeThought: 'みんなにバカにされたに違いない。完璧にできなかった。', evidenceFor: '何度か言葉に詰まった瞬間があった', evidenceAgainst: '参加者は真剣に話を聞いてくれていたし、発表後の質問も多くて興味を持ってくれたようだった。', balancedThought: '完璧でなくても、伝えたいことは伝わったはず。次回はもっと準備して臨もう。', custom_睡眠時間: '6時間', custom_運動: 'なし'},
        { situation: '休日に特に何も予定がない', mood: '退屈', rating: 3, negativeThought: '自分はつまらない人間だから、誰も誘ってくれないんだ', evidenceFor: '特に誘いの連絡はない', evidenceAgainst: '自分で誘うこともできるし、一人で楽しめる趣味もたくさんある。', balancedThought: '誰かに頼るのではなく、自分で時間を有意義に使う方法を見つけよう。', custom_睡眠時間: '7時間', custom_運動: 'ジョギング'},
    ];

    const batch = writeBatch(db);
    const entriesCollection = collection(db, `users/${userId}/cbtEntries`);

    for (const entry of dummyEntries) {
        const randomDays = Math.floor(Math.random() * 60);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - randomDays);
        const newDocRef = doc(entriesCollection);
        batch.set(newDocRef, { ...entry, timestamp: Timestamp.fromDate(timestamp) });
    }
    await batch.commit();
};

// --- PGA Goals & Progress ---

export const onGoalsSnapshot = (
    userId: string, 
    callback: (goals: Goal[]) => void, 
    onError: (error: Error) => void
) => {
    const goalsRef = collection(db, `users/${userId}/pgaGoals`);
    const q = query(goalsRef, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
        const fetchedGoals: Goal[] = [];
        querySnapshot.forEach((doc) => {
            fetchedGoals.push({ id: doc.id, ...doc.data() } as Goal);
        });
        callback(fetchedGoals);
    }, (error) => {
        onError(error);
    });
};

export const addGoal = async (userId: string, goalData: Omit<Goal, 'id' | 'createdAt' | 'status'>) => {
    const goalsRef = collection(db, `users/${userId}/pgaGoals`);
    await addDoc(goalsRef, {
        ...goalData,
        status: '進行中',
        createdAt: Timestamp.now(),
    });
};

export const updateGoalStatus = async (userId: string, goalId: string, status: '進行中' | '達成') => {
    const goalRef = doc(db, `users/${userId}/pgaGoals`, goalId);
    await updateDoc(goalRef, { status });
};

export const deleteGoal = async (userId: string, goalId: string) => {
    const batch = writeBatch(db);
    const progressRef = collection(db, `users/${userId}/pgaGoals/${goalId}/progress`);
    const progressSnapshot = await getDocs(progressRef);
    progressSnapshot.forEach(doc => batch.delete(doc.ref));

    const goalRef = doc(db, `users/${userId}/pgaGoals`, goalId);
    batch.delete(goalRef);
    await batch.commit();
};

export const onProgressSnapshot = (
    userId: string, 
    goalId: string, 
    callback: (progress: ProgressEntry[]) => void, 
    onError: (error: Error) => void
) => {
    const progressRef = collection(db, `users/${userId}/pgaGoals/${goalId}/progress`);
    const q = query(progressRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (querySnapshot) => {
        const fetchedProgress: ProgressEntry[] = [];
        querySnapshot.forEach((doc) => {
            fetchedProgress.push({ id: doc.id, ...doc.data() } as ProgressEntry);
        });
        callback(fetchedProgress);
    }, (error) => {
        onError(error);
    });
};

export const addProgress = async (userId: string, goalId: string, text: string) => {
    const progressRef = collection(db, `users/${userId}/pgaGoals/${goalId}/progress`);
    await addDoc(progressRef, {
        text: text,
        timestamp: Timestamp.now(),
    });
};
