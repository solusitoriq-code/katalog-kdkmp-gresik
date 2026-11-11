import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  getAdminSession,
  onAdminAuthStateChange,
  getAdminProfile,
  signInAdmin,
  signOutAdmin,
  resetAdminPassword,
  updateAdminPassword,
} from '../lib/api';

const SELECTED_VILLAGE_STORAGE_KEY = 'kdkmp:admin:selected_village_id';

function readStoredVillageId() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(SELECTED_VILLAGE_STORAGE_KEY) || '';
    }
  } catch {
    // ignore
  }
  return '';
}

function writeStoredVillageId(villageId) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (villageId) {
        window.localStorage.setItem(SELECTED_VILLAGE_STORAGE_KEY, villageId);
      } else {
        window.localStorage.removeItem(SELECTED_VILLAGE_STORAGE_KEY);
      }
    }
  } catch {
    // ignore
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children, initialState = null }) {
  const [session, setSession] = useState(() => initialState?.session ?? null);
  const [admin, setAdmin] = useState(() => initialState?.admin ?? null);
  const [villages, setVillages] = useState(() => initialState?.villages ?? []);
  const [selectedSuperVillageId, setSelectedSuperVillageId] = useState(() => {
    if (initialState?.selectedVillageId) return initialState.selectedVillageId;
    return readStoredVillageId();
  });
  const [isLoading, setIsLoading] = useState(() =>
    initialState ? Boolean(initialState.isLoading) : true
  );

  const loadSessionAndProfile = useCallback(async (targetSession) => {
    if (!targetSession?.user?.id) {
      setSession(null);
      setAdmin(null);
      setVillages([]);
      setIsLoading(false);
      return;
    }

    setSession(targetSession);
    try {
      const profile = await getAdminProfile(targetSession.user.id, {
        isDemo: Boolean(targetSession.is_demo),
      });
      setAdmin(profile.admin ?? null);
      setVillages(profile.villages ?? []);
    } catch {
      setAdmin(null);
      setVillages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialState) return undefined;

    let mounted = true;

    getAdminSession()
      .then((currentSession) => {
        if (!mounted) return;
        return loadSessionAndProfile(currentSession);
      })
      .catch(() => {
        if (!mounted) return;
        setSession(null);
        setAdmin(null);
        setVillages([]);
        setIsLoading(false);
      });

    const unsubscribe = onAdminAuthStateChange((nextSession) => {
      if (!mounted) return;
      loadSessionAndProfile(nextSession);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [initialState, loadSessionAndProfile]);

  const role = admin?.role ?? null;

  const activeVillageId = useMemo(() => {
    if (!admin) return null;
    if (admin.role === 'village_admin') {
      return admin.village_id || null;
    }
    if (admin.role === 'super_admin') {
      if (
        selectedSuperVillageId &&
        villages.some((v) => v.id === selectedSuperVillageId)
      ) {
        return selectedSuperVillageId;
      }
      return villages[0]?.id ?? null;
    }
    return null;
  }, [admin, selectedSuperVillageId, villages]);

  const activeVillage = useMemo(() => {
    if (!activeVillageId) return null;
    return villages.find((v) => v.id === activeVillageId) ?? null;
  }, [activeVillageId, villages]);

  const setActiveVillageId = useCallback(
    (nextVillageId) => {
      if (role !== 'super_admin') return;
      const vid = String(nextVillageId ?? '').trim();
      setSelectedSuperVillageId(vid);
      writeStoredVillageId(vid);
    },
    [role]
  );

  const signIn = useCallback(
    async ({ email, password }) => {
      setIsLoading(true);
      try {
        const result = await signInAdmin({ email, password });
        await loadSessionAndProfile(result.session);
        return result;
      } catch (err) {
        setIsLoading(false);
        throw err;
      }
    },
    [loadSessionAndProfile]
  );

  const signOut = useCallback(async () => {
    await signOutAdmin();
    setSession(null);
    setAdmin(null);
    setVillages([]);
    setSelectedSuperVillageId('');
    setIsLoading(false);
  }, []);

  const resetPassword = useCallback(async (email, options) => {
    return resetAdminPassword(email, options);
  }, []);

  const updatePassword = useCallback(async (newPassword, options) => {
    return updateAdminPassword(newPassword, options);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return;
    await loadSessionAndProfile(session);
  }, [session, loadSessionAndProfile]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      admin,
      role,
      villages,
      activeVillageId,
      activeVillage,
      setActiveVillageId,
      isLoading,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    }),
    [
      session,
      admin,
      role,
      villages,
      activeVillageId,
      activeVillage,
      setActiveVillageId,
      isLoading,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return ctx;
}

