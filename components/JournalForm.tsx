
import React, { useState, useMemo } from 'react';
import { CbtEntry, CustomField } from '../types';
import { addCbtEntry } from '../services/firebaseService';
import { getBalancedThought } from '../services/geminiService';
import { CloseIcon } from './Icons';

interface JournalFormProps {
    userId: string;
    entries: CbtEntry[];
}

const JournalForm: React.FC<JournalFormProps> = ({ userId, entries }) => {
    const [situation, setSituation] = useState('');
    const [mood, setMood] = useState('');
    const [rating, setRating] = useState(3);
    const [negativeThought, setNegativeThought] = useState('');
    const [evidenceFor, setEvidenceFor] = useState('');
    const [evidenceAgainst, setEvidenceAgainst] = useState('');
    const [balancedThought, setBalancedThought] = useState('');
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    
    const [formLoading, setFormLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(false);
    const [message, setMessage] = useState('');

    const moodSuggestions = useMemo(() => [...new Set(entries.map(e => e.mood).filter(Boolean))], [entries]);

    const customSuggestions = useMemo(() => {
        return entries.reduce((acc, entry) => {
            Object.entries(entry).forEach(([key, value]) => {
                if (key.startsWith('custom_') && value) {
                    const fieldName = key.replace('custom_', '');
                    if (!acc[fieldName]) {
                        acc[fieldName] = new Set();
                    }
                    acc[fieldName].add(value);
                }
            });
            return acc;
        }, {} as Record<string, Set<string>>);
    }, [entries]);

    const resetForm = () => {
        setSituation('');
        setMood('');
        setRating(3);
        setNegativeThought('');
        setEvidenceFor('');
        setEvidenceAgainst('');
        setBalancedThought('');
        setCustomFields([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!situation || !mood || !negativeThought) {
            setMessage('状況、気分、ネガティブ思考は必須項目です。');
            return;
        }

        setFormLoading(true);
        setMessage('');

        try {
            const customData = customFields.reduce((acc, field) => {
                if (field.name && field.value) {
                    acc[`custom_${field.name}`] = field.value;
                }
                return acc;
            }, {} as Record<string, string>);

            await addCbtEntry(userId, {
                timestamp: new Date(),
                situation,
                mood,
                rating,
                negativeThought,
                evidenceFor,
                evidenceAgainst,
                balancedThought,
                ...customData,
            });
            setMessage('思考記録を保存しました！');
            resetForm();
        } catch (error) {
            console.error("Failed to add document: ", error);
            setMessage('保存に失敗しました。もう一度お試しください。');
        } finally {
            setFormLoading(false);
        }
    };

    const handleGeminiAssist = async () => {
        if (!negativeThought) {
            setMessage('ネガティブ思考を入力してください。');
            return;
        }
        setApiLoading(true);
        setMessage('');
        try {
            const suggestion = await getBalancedThought(situation, mood, rating, negativeThought);
            setBalancedThought(suggestion);
            setMessage('Geminiがバランスの取れた思考を提案しました！');
        } catch (error) {
            console.error("Gemini assist failed:", error);
            setMessage('提案の取得中にエラーが発生しました。');
        } finally {
            setApiLoading(false);
        }
    };
    
    const handleAddCustomField = () => setCustomFields([...customFields, { id: Date.now(), name: '', value: '' }]);
    const handleRemoveCustomField = (id: number) => setCustomFields(customFields.filter(f => f.id !== id));
    const handleCustomFieldChange = (id: number, fieldName: 'name' | 'value', value: string) => {
        setCustomFields(customFields.map(f => f.id === id ? { ...f, [fieldName]: value } : f));
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">今日の思考記録</h2>
            {message && <div className={`mb-4 text-center text-sm p-2 rounded-md ${message.includes('失敗') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main Fields */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="situation" className="block text-sm font-medium text-gray-700">状況</label>
                        <textarea id="situation" value={situation} onChange={(e) => setSituation(e.target.value)} placeholder="何が起こりましたか？" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-20" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="mood" className="block text-sm font-medium text-gray-700">気分</label>
                            <input id="mood" type="text" value={mood} onChange={(e) => setMood(e.target.value)} placeholder="どんな気分でしたか？" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" list="mood-suggestions" required />
                            <datalist id="mood-suggestions">{moodSuggestions.map(s => <option key={s} value={s} />)}</datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">気分の評価 (1:最悪 - 5:最高)</label>
                            <div className="flex justify-around items-center bg-gray-50 p-2 rounded-md h-12">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <label key={value} className="flex flex-col items-center cursor-pointer">
                                        <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                                        <span className="text-xs mt-1 text-gray-600">{value}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="negativeThought" className="block text-sm font-medium text-gray-700">自動思考 (ネガティブな考え)</label>
                        <textarea id="negativeThought" value={negativeThought} onChange={(e) => setNegativeThought(e.target.value)} placeholder="頭に浮かんだ考えは？" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-20" required />
                    </div>
                </div>

                {/* Cognitive Restructuring Fields */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">思考のバランスを見つける</h3>
                    <p className="text-sm text-gray-600 mb-4">ネガティブな思考を客観的に見つめ直してみましょう。</p>
                    <div className="space-y-4">
                        <textarea value={evidenceFor} onChange={(e) => setEvidenceFor(e.target.value)} placeholder="思考を支持する証拠は？" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-24" />
                        <textarea value={evidenceAgainst} onChange={(e) => setEvidenceAgainst(e.target.value)} placeholder="思考に反する証拠は？" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-24" />
                        <div className="relative">
                            <textarea value={balancedThought} onChange={(e) => setBalancedThought(e.target.value)} placeholder="よりバランスの取れた思考は？" className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 h-24" />
                            <button type="button" onClick={handleGeminiAssist} disabled={apiLoading || formLoading} className="absolute bottom-2 right-2 bg-emerald-500 text-white text-xs py-1 px-3 rounded-full hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition-all duration-200 disabled:bg-emerald-300">
                                {apiLoading ? '作成中...' : '✨ Gemini Assist'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Custom Fields */}
                <div className="border-t pt-6 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">カスタム項目</h3>
                        <button type="button" onClick={handleAddCustomField} className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold transition-colors duration-200">+ 追加</button>
                    </div>
                    {customFields.map((field, index) => (
                        <div key={field.id} className="flex space-x-2 items-center">
                            <input type="text" value={field.name} onChange={(e) => handleCustomFieldChange(field.id, 'name', e.target.value)} placeholder="項目名" className="w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" list={`custom-name-suggestions-${index}`} />
                            <datalist id={`custom-name-suggestions-${index}`}>{Object.keys(customSuggestions).map(name => <option key={name} value={name} />)}</datalist>
                            <input type="text" value={field.value} onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)} placeholder="内容" className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" list={`custom-value-suggestions-${field.name}`} />
                            {field.name && customSuggestions[field.name] && <datalist id={`custom-value-suggestions-${field.name}`}>{Array.from(customSuggestions[field.name]).map(value => <option key={value as string} value={value as string} />)}</datalist>}
                            <button type="button" onClick={() => handleRemoveCustomField(field.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full transition-colors duration-200"><CloseIcon /></button>
                        </div>
                    ))}
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-indigo-400" disabled={formLoading || apiLoading}>
                    {formLoading ? '保存中...' : '記録を保存'}
                </button>
            </form>
        </div>
    );
};

export default JournalForm;
