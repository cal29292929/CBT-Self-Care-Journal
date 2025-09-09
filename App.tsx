
import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { CbtEntry, View, Goal, ProgressEntry } from './types';
import { auth, onCbtEntriesSnapshot, onGoalsSnapshot, onProgressSnapshot } from './services/firebaseService';
import Header from './components/Header';
import HomeView from './components/HomeView';
import JournalForm from './components/JournalForm';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import PgaView from './components/PgaView';

export default function App() {
    const [user, setUser] = useState<User | null>(null);
    const [entries, setEntries] = useState<CbtEntry[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [progressEntries, setProgressEntries] = useState<Record<string, ProgressEntry[]>>({});
    const [loading, setLoading] = useState(true);
    const [goalLoading, setGoalLoading] = useState(true);
    const [currentView, setCurrentView] = useState<View>('home');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });
        return () => unsubscribe();
    }, []);

    const fetchEntries = useCallback(() => {
        if (user) {
            setLoading(true);
            const unsubscribe = onCbtEntriesSnapshot(
                user.uid,
                (fetchedEntries) => {
                    setEntries(fetchedEntries);
                    setLoading(false);
                },
                (error) => {
                    console.error("Failed to fetch entries:", error);
                    setLoading(false);
                }
            );
            return unsubscribe;
        }
    }, [user]);

    const fetchGoalsAndProgress = useCallback(() => {
        if (user) {
            setGoalLoading(true);
            const unsubscribeGoals = onGoalsSnapshot(
                user.uid,
                (fetchedGoals) => {
                    setGoals(fetchedGoals);
                    setGoalLoading(false);

                    // For each goal, subscribe to its progress entries
                    fetchedGoals.forEach(goal => {
                        onProgressSnapshot(user.uid, goal.id, (fetchedProgress) => {
                            setProgressEntries(prev => ({ ...prev, [goal.id]: fetchedProgress }));
                        }, 
                        (error) => {
                            console.error(`Failed to fetch progress for goal ${goal.id}:`, error);
                        });
                    });
                },
                (error) => {
                    console.error("Failed to fetch goals:", error);
                    setGoalLoading(false);
                }
            );
            return unsubscribeGoals;
        }
    }, [user]);

    useEffect(() => {
        const unsubEntries = fetchEntries();
        const unsubGoals = fetchGoalsAndProgress();
        return () => {
            if (unsubEntries) unsubEntries();
            if (unsubGoals) unsubGoals();
        };
    }, [fetchEntries, fetchGoalsAndProgress]);

    const renderCurrentView = () => {
        if (!user) {
            return (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 text-center">
                    <p className="text-gray-700">Authenticating user...</p>
                </div>
            );
        }
        
        switch (currentView) {
            case 'journal':
                return <JournalForm userId={user.uid} entries={entries} />;
            case 'dashboard':
                return <DashboardView userId={user.uid} entries={entries} loading={loading} />;
            case 'analytics':
                return <AnalyticsView entries={entries} />;
            case 'pga':
                return <PgaView userId={user.uid} goals={goals} progressEntries={progressEntries} goalLoading={goalLoading} />;
            case 'home':
            default:
                return <HomeView userId={user.uid} />;
        }
    };

    return (
        <div className="font-sans bg-gray-50 min-h-screen p-4 sm:p-8 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8">
                <Header currentView={currentView} setCurrentView={setCurrentView} />
                <main>
                    {renderCurrentView()}
                </main>
            </div>
        </div>
    );
}
