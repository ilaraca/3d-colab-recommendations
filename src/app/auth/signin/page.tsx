'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/components/auth-provider';
import { DEMO_USERS } from '@/lib/constants';
import { Sparkles } from 'lucide-react';

function SignInForm() {
  const searchParams = useSearchParams();
  const { handleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');

  const callbackUrl = searchParams.get('callbackUrl') || '/marketplace';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await handleLogin(email, password);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setIsLoading(true);
    try {
      await handleLogin(demoEmail, 'demo123');
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-lg py-12">
      <div className="text-center mb-8">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-2" />
        <h1 className="text-2xl font-bold">Entrar na demo</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Use os logins fixos abaixo para testar recomendações personalizadas
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Logins de demonstração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_USERS.map((demo) => (
            <Button
              key={demo.email}
              variant="outline"
              className="w-full justify-start h-auto py-3"
              disabled={isLoading}
              onClick={() => quickLogin(demo.email)}
            >
              <div className="text-left">
                <p className="font-medium">{demo.email}</p>
                <p className="text-xs text-muted-foreground">{demo.hint}</p>
              </div>
            </Button>
          ))}
          <p className="text-xs text-muted-foreground pt-2">Senha para todos: demo123</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@demo.com"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="container py-12">Carregando...</div>}>
      <SignInForm />
    </Suspense>
  );
}
