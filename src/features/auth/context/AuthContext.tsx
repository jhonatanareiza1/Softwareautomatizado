import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

import {
    onAuthStateChanged,
    signOut,
    type User as FirebaseUser,
} from 'firebase/auth';

import { firebaseAuth } from '../../../services/firebase/config';

import { getUserProfile } from '../../../services/firebase/users';

import type { User } from '../../../types';

interface AuthContextValue {
    user: FirebaseUser | null;
    firebaseUser: FirebaseUser | null;
    profile: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext =
    createContext<AuthContextValue | undefined>(
        undefined,
    );

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({
    children,
}: AuthProviderProps) {
    const [firebaseUser, setFirebaseUser] =
        useState<FirebaseUser | null>(null);

    const [profile, setProfile] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const unsubscribe =
            onAuthStateChanged(
                firebaseAuth,
                async (user) => {
                    setFirebaseUser(user);

                    if (!user) {
                        setProfile(null);
                        setLoading(false);
                        return;
                    }

                    try {
                        const userProfile =
                            await getUserProfile(
                                user.uid,
                            );

                        setProfile(userProfile);
                    } catch (error) {
                        console.error(
                            'Error loading user profile:',
                            error,
                        );

                        setProfile(null);
                    } finally {
                        setLoading(false);
                    }
                },
            );

        return unsubscribe;
    }, []);

    const logout =
        async (): Promise<void> => {
            await signOut(firebaseAuth);
        };

    return (
        <AuthContext.Provider
            value={{
                user: firebaseUser,
                firebaseUser,
                profile,
                loading,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used inside AuthProvider',
        );
    }

    return context;
}