"use client";

import Link from 'next/link';
import { LogOut, User, Settings, Edit, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { clearPreviewDemoSession } from '@/lib/preview-demo';
import { useStoredUser } from '@/hooks/useStoredUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const router = useRouter();
  const user = useStoredUser();

  const initials =
    user?.displayName?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    'ME';

  const handleLogout = () => {
    clearPreviewDemoSession();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-xl border border-border/60 bg-secondary/60 px-1.5 text-sm hover:bg-secondary/80 transition-colors outline-none sm:h-10 sm:px-2.5">
        <Avatar className="h-7 w-7">
          <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.displayName ?? 'User'} />
          <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary-accessible">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium text-foreground md:inline max-w-[120px] truncate">
          {user?.displayName ?? 'Account'}
        </span>
        <ChevronDown className="icon-sm text-muted-foreground hidden md:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.displayName ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
            {user?.role && (
              <p className="text-xs text-primary-accessible capitalize">{user.role}</p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 icon-sm" /> My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/profile/edit">
            <Edit className="mr-2 icon-sm" /> Edit Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 icon-sm" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive-accessible focus:text-destructive-accessible">
          <LogOut className="mr-2 icon-sm" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
