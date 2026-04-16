import type { User } from 'firebase/auth';
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PRIMARY_COMPANY_NAME } from '@/constants';
import { SystemConfig, UserAccessStatus, UserProfile } from '@/types';

function systemConfigRef() {
  return doc(db, 'system', 'main');
}

function profileRef(uid: string) {
  return doc(db, 'users', uid, 'profile', 'main');
}

function inferNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] || 'usuario';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Usuário';
}

function normalizeProfile(
  firebaseUser: User,
  systemConfig: SystemConfig,
  existingProfile?: Partial<UserProfile> | null,
  preferredName?: string
): UserProfile {
  const now = Timestamp.now();
  const isAdmin = systemConfig.adminUid === firebaseUser.uid;
  const existingStatus = existingProfile?.accessStatus;
  const accessStatus: UserAccessStatus = isAdmin
    ? 'approved'
    : existingStatus ?? (existingProfile ? 'approved' : 'pending');

  const approvedAt =
    accessStatus === 'approved'
      ? existingProfile?.approvedAt || (isAdmin ? now : undefined)
      : undefined;
  const approvedBy =
    accessStatus === 'approved'
      ? existingProfile?.approvedBy || (isAdmin ? systemConfig.adminUid : undefined)
      : undefined;

  return {
    uid: firebaseUser.uid,
    name:
      existingProfile?.name ||
      preferredName ||
      firebaseUser.displayName ||
      inferNameFromEmail(firebaseUser.email || ''),
    email: existingProfile?.email || firebaseUser.email || '',
    companyName: PRIMARY_COMPANY_NAME,
    companyDocument: existingProfile?.companyDocument || undefined,
    phone: existingProfile?.phone || undefined,
    photoUrl: firebaseUser.photoURL || existingProfile?.photoUrl || undefined,
    currency: existingProfile?.currency || 'BRL',
    locale: existingProfile?.locale || 'pt-BR',
    role: isAdmin ? 'admin' : existingProfile?.role || 'user',
    accessStatus,
    approvedAt,
    approvedBy,
    rejectedAt: accessStatus === 'rejected' ? existingProfile?.rejectedAt : undefined,
    rejectedBy: accessStatus === 'rejected' ? existingProfile?.rejectedBy : undefined,
    createdAt: existingProfile?.createdAt || now,
    updatedAt: now,
  };
}

function shouldSyncProfile(
  existingProfile: Partial<UserProfile> | null,
  nextProfile: UserProfile
): boolean {
  if (!existingProfile) return true;

  return (
    existingProfile.name !== nextProfile.name ||
    existingProfile.email !== nextProfile.email ||
    existingProfile.photoUrl !== nextProfile.photoUrl ||
    existingProfile.companyName !== nextProfile.companyName ||
    existingProfile.currency !== nextProfile.currency ||
    existingProfile.locale !== nextProfile.locale ||
    existingProfile.role !== nextProfile.role ||
    existingProfile.accessStatus !== nextProfile.accessStatus ||
    existingProfile.approvedBy !== nextProfile.approvedBy ||
    existingProfile.rejectedBy !== nextProfile.rejectedBy
  );
}

export async function ensureSystemConfig(uid: string): Promise<SystemConfig> {
  const ref = systemConfigRef();

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (snapshot.exists()) {
      return snapshot.data() as SystemConfig;
    }

    const now = Timestamp.now();
    const config: SystemConfig = {
      primaryCompanyName: PRIMARY_COMPANY_NAME,
      adminUid: uid,
      createdAt: now,
      updatedAt: now,
    };

    transaction.set(ref, config);
    return config;
  });
}

export async function getSystemConfig(): Promise<SystemConfig | null> {
  const snapshot = await getDoc(systemConfigRef());
  return snapshot.exists() ? (snapshot.data() as SystemConfig) : null;
}

export async function ensureUserProfile(
  firebaseUser: User,
  preferredName?: string
): Promise<{
  profile: UserProfile;
  systemConfig: SystemConfig;
  isNewUser: boolean;
}> {
  const systemConfig = await ensureSystemConfig(firebaseUser.uid);
  const ref = profileRef(firebaseUser.uid);
  const snapshot = await getDoc(ref);
  const existingProfile = snapshot.exists()
    ? (snapshot.data() as Partial<UserProfile>)
    : null;
  const profile = normalizeProfile(
    firebaseUser,
    systemConfig,
    existingProfile,
    preferredName
  );

  if (shouldSyncProfile(existingProfile, profile)) {
    await setDoc(ref, profile, { merge: true });
  }

  return {
    profile,
    systemConfig,
    isNewUser: !snapshot.exists(),
  };
}

export async function listUserProfiles(): Promise<UserProfile[]> {
  const snapshot = await getDocs(collectionGroup(db, 'profile'));

  return snapshot.docs
    .map((docSnap) => docSnap.data() as UserProfile)
    .filter((profile) => profile.uid)
    .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
}

export async function updateUserAccessStatus(
  uid: string,
  accessStatus: UserAccessStatus,
  adminUid: string
): Promise<void> {
  const config = await getSystemConfig();

  if (!config) {
    throw new Error('Configuração principal da empresa não encontrada.');
  }

  if (uid === config.adminUid) {
    throw new Error('O administrador principal não pode ter o acesso removido.');
  }

  const now = Timestamp.now();

  await updateDoc(profileRef(uid), {
    accessStatus,
    role: 'user',
    approvedAt: accessStatus === 'approved' ? now : null,
    approvedBy: accessStatus === 'approved' ? adminUid : null,
    rejectedAt: accessStatus === 'rejected' ? now : null,
    rejectedBy: accessStatus === 'rejected' ? adminUid : null,
    updatedAt: now,
  });
}
