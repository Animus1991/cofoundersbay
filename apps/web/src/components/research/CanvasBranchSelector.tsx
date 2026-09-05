'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ChevronDown, Check, Plus, Loader2, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { listCanvasBranches, type CanvasBranch } from '@/lib/api';

interface CanvasBranchSelectorProps {
  boardId: string;
  activeBranchId?: string | null;
  onBranchSelect: (branchId: string | null, branchName: string | null) => void;
  onCreateBranch?: () => void;
  className?: string;
}

export function CanvasBranchSelector({
  boardId,
  activeBranchId,
  onBranchSelect,
  onCreateBranch,
  className,
}: CanvasBranchSelectorProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['canvas-branches', boardId],
    queryFn: () => listCanvasBranches(boardId),
    enabled: open || !!activeBranchId,
    staleTime: 30_000,
  });

  const branches: CanvasBranch[] = data ?? [];
  const activeBranch = branches.find((b) => b.id === activeBranchId) ?? null;
  const label = activeBranch?.name ?? 'main';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('h-8 gap-1.5 px-2.5 text-xs font-medium', className)}
        >
          <GitBranch className="h-3.5 w-3.5 text-violet-500" />
          <span className="max-w-[100px] truncate">{label}</span>
          {isLoading && <Loader2 className="h-3 w-3 animate-spin ml-0.5" />}
          {!isLoading && <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch branch
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Mainline */}
        <DropdownMenuItem
          className="flex items-center justify-between gap-2 cursor-pointer"
          onClick={() => { onBranchSelect(null, null); setOpen(false); }}
        >
          <div className="flex items-center gap-2">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">main</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">default</Badge>
          </div>
          {!activeBranchId && <Check className="h-3.5 w-3.5 text-primary-accessible shrink-0" />}
        </DropdownMenuItem>

        {branches.filter((b) => !b.isDefault).length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal uppercase tracking-wide px-2">
              Branches
            </DropdownMenuLabel>
            {branches
              .filter((b) => !b.isDefault)
              .map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  className={cn(
                    'flex items-center justify-between gap-2 cursor-pointer',
                    b.status !== 'active' && 'opacity-50',
                  )}
                  onClick={() => { onBranchSelect(b.id, b.name); setOpen(false); }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {b.status === 'archived' ? (
                      <Archive className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    ) : (
                      <GitBranch className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">{b.name}</span>
                    {b.status === 'merged' && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-3.5 shrink-0 text-violet-600 border-violet-200">merged</Badge>
                    )}
                  </div>
                  {activeBranchId === b.id && <Check className="h-3.5 w-3.5 text-primary-accessible shrink-0" />}
                </DropdownMenuItem>
              ))}
          </>
        )}

        {onCreateBranch && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer text-primary-accessible"
              onClick={() => { setOpen(false); onCreateBranch(); }}
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-sm">New branch…</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
