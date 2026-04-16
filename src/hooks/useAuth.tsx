'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile } from '@/types';
import { seedDefaultCategories } from '@/services/categoryService';
import { seedDefaultBankAccount } from '@/services/accountService';
import { seedDefaultCostCenter } from '@/services/costCenterService';
import { ensureUserProfile } from '@/services/userService';
import { PRIMARY_COMPANY_NAME } from '@/constants';

interface AuthResult {
  profile: UserProfile;
  isNewUser: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  companyUid: string | null;
  isAdmin: boolean;
  hasDashboardAccess: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<AuthResult | null>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [companyUid, setCompanyUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const seedCompanyData = useCallback(async (uid: string) => {
    await Promise.all([
      seedDefaultCategories(uid),
      seedDefaultBankAccount(uid),
      seedDefaultCostCenter(uid),
    ]);
  }, []);

  const refreshProfileState = useCallback(
    async (firebaseUser: User): Promise<AuthResult> => {
      const result = await ensureUserProfile(firebaseUser);
      setProfile(result.profile);
      setCompanyUid(
        result.profile.accessStatus === 'approved' ? result.systemConfig.adminUid : null
      );

      if (result.systemConfig.adminUid === firebaseUser.uid) {
        await seedCompanyData(firebaseUser.uid);
      }

      return result;
    },
    [seedCompanyData]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshProfileState(firebaseUser);
      } else {
        setProfile(null);
        setCompanyUid(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshProfileState]);

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
        return null;
      }
      throw error;
    }

    return await refreshProfileState(cred.user);
  }, [refreshProfileState]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setProfile(null);
    setCompanyUid(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return null;

    const result = await refreshProfileState(auth.currentUser);
    return result.profile;
  }, [refreshProfileState]);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const ref = doc(db, 'users', user.uid, 'profile', 'main');
      const updated = {
        ...data,
        companyName: profile?.companyName || PRIMARY_COMPANY_NAME,
        updatedAt: Timestamp.now(),
      };
      await setDoc(ref, updated, { merge: true });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
    },
    [profile?.companyName, user]
  );

  const isAdmin = profile?.role === 'admin';
  const hasDashboardAccess = profile?.accessStatus === 'approved';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        companyUid,
        isAdmin,
        hasDashboardAccess,
        loading,
        signInWithGoogle,
        signOut,
        refreshProfile,
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
