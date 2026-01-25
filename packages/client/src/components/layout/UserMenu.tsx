import { Button, Separator } from '@/components/ui';

interface UserMenuProps {
  email: string;
  onLogout: () => void;
  children?: any; // For additional items before the email
}

export function UserMenu({ email, onLogout, children }: UserMenuProps) {
  return (
    <div className="flex items-center gap-4">
      {children}
      {children && <Separator orientation="vertical" className="h-6" />}
      <span className="text-muted-foreground text-sm">{email}</span>
      <Button variant="ghost" onClick={onLogout}>
        Sign Out
      </Button>
    </div>
  );
}
