
import React from 'react';

interface HomeViewProps {
    userId: string | null;
}

const HomeView: React.FC<HomeViewProps> = ({ userId }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 text-gray-700 space-y-6 animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-800">アプリの使い方</h2>
            <p className="leading-relaxed">
                このアプリは、<span className="font-semibold text-indigo-600">自己管理</span>と<span className="font-semibold text-indigo-600">認知行動療法（CBT）</span>の考え方を使って、日々の出来事や心の状態を整理するのを助けます。
            </p>
            <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-indigo-800">思考記録</h3>
                    <p className="mt-1">ネガティブな気持ちになった時の<span className="font-bold">状況</span>、<span className="font-bold">気分</span>、<span className="font-bold">思考</span>を記録します。そして、その思考を客観的に見つめ直し、より現実的でバランスの取れた考え方を見つける手助けをします。</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-emerald-800">記録の振り返りと分析</h3>
                    <p className="mt-1">これまでの記録を振り返ることで、自分自身の傾向を理解し、Gemini AIによる分析で新たな気づきを得ることができます。</p>
                </div>
                 <div className="p-4 bg-sky-50 rounded-lg">
                    <h3 className="font-semibold text-lg text-sky-800">目標達成 (PGA)</h3>
                    <p className="mt-1">Positive Goal Achievement (PGA) 機能で、達成したい目標を設定し、日々の進捗を記録してモチベーションを維持しましょう。</p>
                </div>
            </div>
            <div className="mt-6 pt-6 border-t">
                <p className="text-sm">
                    <span className="font-semibold">あなたのユーザーID:</span>
                    <code className="ml-2 bg-gray-200 text-gray-800 p-1 rounded text-sm break-all">{userId || '読み込み中...'}</code>
                </p>
            </div>
        </div>
    );
};

export default HomeView;
