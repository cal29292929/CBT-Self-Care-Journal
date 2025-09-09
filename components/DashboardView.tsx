
import React, { useState } from 'react';
import { CbtEntry } from '../types';
import { formatDate } from '../utils';
import { addDummyEntries, deleteCbtEntry } from '../services/firebaseService';
import { TrashIcon } from './Icons';

interface DashboardViewProps {
    userId: string;
    entries: CbtEntry[];
    loading: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ userId, entries, loading }) => {
    const [message, setMessage] = useState('');
    const [dummyLoading, setDummyLoading] = useState(false);

    const handleAddDummyEntries = async () => {
        setDummyLoading(true);
        setMessage('テストデータを追加中...');
        try {
            await addDummyEntries(userId);
            setMessage('テストデータを5件追加しました！');
        } catch (error) {
            console.error(error);
            setMessage('テストデータの追加に失敗しました。');
        } finally {
            setDummyLoading(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('この記録を削除してもよろしいですか？')) return;
        try {
            await deleteCbtEntry(userId, id);
            setMessage('記録を削除しました。');
        } catch (error) {
            console.error("Failed to delete document: ", error);
            setMessage('削除に失敗しました。');
        } finally {
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">過去の思考記録</h2>
            {message && <div className={`mb-4 text-center text-sm p-2 rounded-md ${message.includes('失敗') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
            <button
                onClick={handleAddDummyEntries}
                disabled={dummyLoading || loading}
                className="w-full mb-6 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {dummyLoading ? '追加中...' : 'テストデータを追加'}
            </button>
            
            {loading ? (
                <div className="text-center text-gray-500 py-8">記録を読み込み中...</div>
            ) : entries.length === 0 ? (
                <div className="text-center text-gray-500 py-8">まだ記録がありません。</div>
            ) : (
                <div className="space-y-4">
                    {entries.map((entry) => (
                        <div key={entry.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative group">
                            <button onClick={() => handleDelete(entry.id)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="記録を削除">
                                <TrashIcon />
                            </button>
                            <h3 className="text-lg font-semibold text-gray-900 pr-8">{formatDate(entry.timestamp)}</h3>
                            <div className="mt-2 space-y-2 text-sm">
                                <p><span className="font-semibold text-gray-600">状況:</span> {entry.situation}</p>
                                <p><span className="font-semibold text-gray-600">気分:</span> {entry.mood} <span className="ml-2 text-amber-500 font-bold">{'★'.repeat(entry.rating)}{'☆'.repeat(5 - entry.rating)}</span></p>
                                <p><span className="font-semibold text-gray-600">自動思考:</span> {entry.negativeThought}</p>
                                {entry.balancedThought && <p className="p-2 bg-emerald-50 rounded-md"><span className="font-semibold text-emerald-800">バランスの取れた思考:</span> {entry.balancedThought}</p>}
                                {Object.entries(entry).filter(([key, value]) => key.startsWith('custom_') && value).map(([key, value]) => (
                                    <p key={key} className="text-gray-700"><span className="font-semibold text-gray-600">{key.replace('custom_', '')}:</span> {value}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DashboardView;
