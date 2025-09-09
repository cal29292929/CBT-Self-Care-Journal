
import React, { useState, useMemo } from 'react';
import { CbtEntry } from '../types';
import { getEntriesAnalysis, getAnalysisTTS } from '../services/geminiService';
import { base64ToArrayBuffer, pcmToWav } from '../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsViewProps {
    entries: CbtEntry[];
}

const AnalyticsView: React.FC<AnalyticsViewProps> = ({ entries }) => {
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [ttsLoading, setTtsLoading] = useState(false);
    const [geminiAnalysisResult, setGeminiAnalysisResult] = useState('');
    const [message, setMessage] = useState('');

    const moodCounts = useMemo(() => {
        return entries.reduce((acc, entry) => {
            const mood = entry.mood || '不明';
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [entries]);

    const chartData = useMemo(() => {
        return entries
            .map(entry => ({
                date: entry.timestamp.toDate().toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
                rating: entry.rating || 0,
            }))
            .reverse();
    }, [entries]);

    const handleGeminiAnalysis = async () => {
        if (entries.length === 0) {
            setMessage('分析には記録が必要です。');
            return;
        }
        setAnalysisLoading(true);
        setGeminiAnalysisResult('');
        setMessage('');

        try {
            const result = await getEntriesAnalysis(entries);
            setGeminiAnalysisResult(result);
            setMessage('Geminiが記録を分析しました！');
        } catch (error) {
            console.error("Gemini analysis failed:", error);
            setMessage('分析の取得中にエラーが発生しました。');
        } finally {
            setAnalysisLoading(false);
        }
    };

    const handleTTS = async () => {
        if (!geminiAnalysisResult) {
            setMessage('最初に記録を分析してください。');
            return;
        }
        setTtsLoading(true);
        setMessage('アドバイスを音声で生成中...');
        try {
            const { audioData, mimeType } = await getAnalysisTTS(geminiAnalysisResult);
            const sampleRateMatch = mimeType.match(/rate=(\d+)/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;
            const pcmData = base64ToArrayBuffer(audioData);
            const wavBlob = pcmToWav(pcmData, sampleRate);
            const audioUrl = URL.createObjectURL(wavBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            setMessage('読み上げ中...');
            audio.onended = () => {
                setMessage('読み上げが完了しました。');
                setTtsLoading(false);
            };
        } catch (error) {
            console.error("TTS failed:", error);
            setMessage('音声の生成中にエラーが発生しました。');
            setTtsLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 space-y-8">
            <h2 className="text-2xl font-bold text-gray-800">記録の分析</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">記録の概要</h3>
                    <p className="text-gray-700">これまでの記録総数: <span className="font-bold text-indigo-600">{entries.length}</span> 件</p>
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">気分の傾向</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {Object.entries(moodCounts).map(([mood, count]) => (
                            <li key={mood}><span className="font-semibold">{mood}</span>: {count}回</li>
                        ))}
                    </ul>
                </div>
            </div>

            {entries.length > 1 && (
                <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">気分の推移グラフ</h3>
                    <div style={{ width: '100%', height: 300 }}>
                         <ResponsiveContainer>
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="rating" name="気分の評価" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            <div className="border-t pt-6 space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Geminiによる分析とアドバイス</h3>
                <p className="text-sm text-gray-600">過去10件の記録をもとに、傾向とアドバイスを提案します。</p>
                 {message && <div className={`text-center text-sm p-2 rounded-md ${message.includes('エラー') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</div>}
                <button
                    onClick={handleGeminiAnalysis}
                    disabled={analysisLoading || entries.length === 0}
                    className="w-full bg-emerald-500 text-white py-2 px-4 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition-colors duration-200 disabled:bg-emerald-300"
                >
                    {analysisLoading ? '分析中...' : '✨ 記録を分析してもらう'}
                </button>
                {geminiAnalysisResult && (
                    <div className="mt-4 space-y-4">
                        <div className="p-4 bg-gray-100 rounded-lg whitespace-pre-wrap text-gray-800">{geminiAnalysisResult}</div>
                        <button
                            onClick={handleTTS}
                            disabled={ttsLoading}
                            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-colors duration-200 disabled:bg-indigo-300"
                        >
                            {ttsLoading ? '生成中...' : '🔊 アドバイスを読み上げる'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsView;
