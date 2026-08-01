"use client";

import { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { useSession, signIn, signOut } from 'next-auth/react';

interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  logout: () => Promise<void>;
  handleLogin: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();

  const user = session?.user as UserData | null;
  const loading = status === 'loading';

  const handleLogin = async (email: string, password: string) => {
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) throw new Error(result.error);
    router.refresh();
    router.push('/marketplace');
  };

  const logout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
    toast({ title: 'Logout realizado' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, handleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
