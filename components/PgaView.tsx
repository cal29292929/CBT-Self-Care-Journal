
import React, { useState } from 'react';
import { Goal, ProgressEntry } from '../types';
import { addGoal, updateGoalStatus, deleteGoal, addProgress } from '../services/firebaseService';
import { formatDate } from '../utils';
import { TrashIcon } from './Icons';

interface PgaViewProps {
    userId: string;
    goals: Goal[];
    progressEntries: Record<string, ProgressEntry[]>;
    goalLoading: boolean;
}

const ProgressForm: React.FC<{ goalId: string; userId: string; }> = ({ goalId, userId }) => {
    const [text, setText] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        addProgress(userId, goalId, text.trim());
        setText('');
    };
    return (
        <form onSubmit={handleSubmit} className="flex space-x-2 mt-2">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="進捗を記録..." className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            <button type="submit" className="bg-indigo-500 text-white px-4 py-1 rounded-md hover:bg-indigo-600 transition-colors text-sm font-semibold">記録</button>
        </form>
    );
};

const PgaView: React.FC<PgaViewProps> = ({ userId, goals, progressEntries, goalLoading }) => {
    const [newGoal, setNewGoal] = useState({ title: '', description: '', targetDate: '' });
    const [message, setMessage] = useState('');

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGoal.title) {
            setMessage('目標タイトルは必須です。');
            return;
        }
        try {
            await addGoal(userId, newGoal);
            setNewGoal({ title: '', description: '', targetDate: '' });
            setMessage('新しい目標を追加しました！');
        } catch (error) {
            setMessage('目標の追加に失敗しました。');
            console.error(error);
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">新しい目標を設定する</h2>
                 {message && <div className={`mb-4 text-center text-sm p-2 rounded-md ${message.includes('失敗') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
                <form onSubmit={handleAddGoal} className="space-y-4">
                    <input type="text" value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="達成したいことは何ですか？" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" required />
                    <textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} placeholder="目標の詳細や、なぜそれが重要なのかを書きましょう。" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-20" />
                    <input type="date" value={newGoal.targetDate} onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })} className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
                    <button type="submit" className="w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors">目標を追加</button>
                </form>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">目標一覧</h2>
                {goalLoading ? ( <p>目標を読み込み中...</p> ) : goals.length === 0 ? ( <p>まだ目標が設定されていません。</p> ) : (
                    <div className="space-y-4">
                        {goals.map(goal => (
                            <div key={goal.id} className={`p-4 border rounded-lg ${goal.status === '達成' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">{goal.title}</h3>
                                        <p className="text-sm text-gray-600">{goal.description}</p>
                                        {goal.targetDate && <p className="text-xs text-gray-500 mt-1">目標日: {goal.targetDate}</p>}
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <button onClick={() => updateGoalStatus(userId, goal.id, goal.status === '進行中' ? '達成' : '進行中')} className={`text-sm font-semibold px-3 py-1 rounded-full transition-colors ${goal.status === '進行中' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'}`}>
                                            {goal.status === '進行中' ? '達成' : '再開'}
                                        </button>
                                        <button onClick={() => deleteGoal(userId, goal.id)} className="text-gray-400 hover:text-red-500"><TrashIcon /></button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-semibold text-gray-700 text-sm">進捗記録</h4>
                                    <ProgressForm goalId={goal.id} userId={userId} />
                                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-2">
                                        {progressEntries[goal.id]?.map(entry => (
                                            <div key={entry.id} className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-200">
                                                <span className="text-xs text-gray-400 mr-2">{formatDate(entry.timestamp)}:</span> {entry.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PgaView;
