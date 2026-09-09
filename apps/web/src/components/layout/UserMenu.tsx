"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogOut, User, Settings, Edit, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

type StoredUser = { id?: string; displayName?: string; email?: string; role?: string; avatarUrl?: string } | null;

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
  }, []);

  const initials =
    user?.displayName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'ME';

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-2.5 py-1.5 text-sm hover:bg-secondary/80 transition-colors outline-none">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? 'User'} />
          <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary-emphasis">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium text-foreground md:inline max-w-[120px] truncate">
          {user?.displayName ?? 'Account'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
            {user?.role && (
              <p className="text-xs text-primary-emphasis capitalize">{user.role}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 icon-sm" aria-hidden="true" /> My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit">
            <Edit className="mr-2 icon-sm" aria-hidden="true" /> Edit Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 icon-sm" aria-hidden="true" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive-emphasis focus:text-destructive-emphasis">
          <LogOut className="mr-2 icon-sm" aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
