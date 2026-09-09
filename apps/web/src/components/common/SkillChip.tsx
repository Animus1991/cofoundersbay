import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type SkillChipProps = {
  label: string;
  active?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

export function SkillChip({ 
  label, 
  active, 
  removable, 
  onRemove,
  onClick,
  size = 'md',
  className,
}: SkillChipProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-2xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const isInteractive = onClick || removable;

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/60 font-medium transition-all duration-200',
        sizeClasses[size],
        active 
          ? 'bg-primary/20 text-primary-emphasis border-primary/30 shadow-sm' 
          : 'bg-secondary/60 text-muted-foreground hover:text-foreground',
        isInteractive && 'cursor-pointer hover:scale-105 active:scale-95',
        isInteractive && !active && 'hover:bg-secondary/80 hover:border-border',
        className,
      )}
    >
      {label}
      {removable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
        >
          <X className="icon-2xs" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

// Skill chip group with add button
type SkillChipGroupProps = {
  skills: string[];
  onAdd?: () => void;
  onRemove?: (skill: string) => void;
  maxDisplay?: number;
  className?: string;
};

export function SkillChipGroup({ 
  skills, 
  onAdd, 
  onRemove, 
  maxDisplay = 5,
  className,
}: SkillChipGroupProps) {
  const displaySkills = skills.slice(0, maxDisplay);
  const remaining = skills.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displaySkills.map((skill) => (
        <SkillChip
          key={skill}
          label={skill}
          removable={!!onRemove}
          onRemove={() => onRemove?.(skill)}
        />
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center rounded-full bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          +{remaining} more
        </span>
      )}
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground hover:border-primary/50 hover:text-primary-emphasis transition-colors"
        >
          + Add skill
        </button>
      )}
    </div>
  );
}
