"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Home, LogIn, LogOut, User, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2 mr-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-semibold hidden sm:inline">3D Colab Rec</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2">
          <Link href="/marketplace">
            <Button variant="ghost">Marketplace</Button>
          </Link>
          <Link href="/learn">
            <Button variant="ghost">Laboratório</Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost">Sobre</Button>
          </Link>
          <ThemeToggle />

          {loading ? (
            <span className="text-sm text-muted-foreground">...</span>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => router.push('/auth/signin')} className="gap-2">
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
