import { Button, Separator } from '@/components/ui';

interface UserMenuProps {
  email: string;
  onLogout: () => void;
  children?: any; // For additional items before the email
}

export function UserMenu({ email, onLogout, children }: UserMenuProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
      {children}
      {children && <Separator orientation="vertical" className="h-6 hidden sm:block" />}
      <span className="text-muted-foreground text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
        {email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onLogout}
        className="text-xs sm:text-sm px-2 sm:px-4"
      >
        Sign Out
      </Button>
    </div>
  );
}
