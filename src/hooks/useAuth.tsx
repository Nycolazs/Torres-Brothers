'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { seedDefaultCategories } from '@/services/categoryService';
import { seedDefaultBankAccount } from '@/services/accountService';
import { seedDefaultCostCenter } from '@/services/costCenterService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    const profileDoc = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
    if (profileDoc.exists()) {
      setProfile(profileDoc.data() as UserProfile);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const seedNewUser = useCallback(async (uid: string) => {
    await Promise.all([
      seedDefaultCategories(uid),
      seedDefaultBankAccount(uid),
      seedDefaultCostCenter(uid),
    ]);
  }, []);

  const createProfile = useCallback(
    async (uid: string, name: string, email: string, photoUrl?: string) => {
      const profileData: UserProfile = {
        uid,
        name,
        email,
        currency: 'BRL',
        locale: 'pt-BR',
        photoUrl: photoUrl || undefined,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await setDoc(doc(db, 'users', uid, 'profile', 'main'), profileData);
      setProfile(profileData);
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await createProfile(cred.user.uid, name, email);
      await seedNewUser(cred.user.uid);
    },
    [createProfile, seedNewUser]
  );

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    let cred;
    try {
      cred = await signInWithPopup(auth, provider);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };
      if (
        firebaseError.code === 'auth/popup-blocked' ||
        firebaseError.code === 'auth/popup-closed-by-user' ||
        firebaseError.code === 'auth/cancelled-popup-request' ||
        firebaseError.code === 'auth/web-storage-unsupported'
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw error;
    }

    const profileDoc = await getDoc(
      doc(db, 'users', cred.user.uid, 'profile', 'main')
    );

    if (!profileDoc.exists()) {
      await createProfile(
        cred.user.uid,
        cred.user.displayName || 'Usuário',
        cred.user.email || '',
        cred.user.photoURL || undefined
      );
      await seedNewUser(cred.user.uid);
    }
  }, [createProfile, seedNewUser]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid, 'profile', 'main');
      const updated = { ...data, updatedAt: Timestamp.now() };
      await setDoc(ref, updated, { merge: true });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };
