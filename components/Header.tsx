
import React from 'react';
import { View } from '../types';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView }) => {
    const navItems: { view: View; label: string }[] = [
        { view: 'home', label: 'ホーム' },
        { view: 'journal', label: '思考記録' },
        { view: 'dashboard', label: '記録を見る' },
        { view: 'analytics', label: '分析' },
        { view: 'pga', label: '目標達成' },
    ];

    return (
        <header className="bg-white rounded-xl shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <h1 className="text-3xl font-extrabold text-indigo-700">自己管理ノート</h1>
            <nav className="flex space-x-1 sm:space-x-2 flex-wrap justify-center">
                {navItems.map(({ view, label }) => (
                    <button
                        key={view}
                        onClick={() => setCurrentView(view)}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${
                            currentView === view
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-indigo-600 hover:bg-indigo-100'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </nav>
        </header>
    );
};

export default Header;
