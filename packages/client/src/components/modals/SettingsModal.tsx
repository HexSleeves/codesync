/**
 * SettingsModal - User preferences modal
 * Persists settings to localStorage via the settings store
 */

import { SettingsIcon } from '@/components/icons';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  type DiffMode,
  type FontSize,
  settingsStore,
  type Theme,
  useSettingsStore,
  type ViewMode,
} from '@/stores/settings';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  // Use single combined selector for all state values (reduces from 7 subscriptions to 1)
  const {
    theme,
    fontSize,
    defaultDiffMode,
    defaultViewMode,
    showLineNumbers,
    soundEnabled,
    desktopNotifications,
  } = useSettingsStore((s) => ({
    theme: s.theme,
    fontSize: s.fontSize,
    defaultDiffMode: s.defaultDiffMode,
    defaultViewMode: s.defaultViewMode,
    showLineNumbers: s.showLineNumbers,
    soundEnabled: s.soundEnabled,
    desktopNotifications: s.desktopNotifications,
  }));

  // Access actions via getState() - no subscription needed (actions are stable)
  const {
    setTheme,
    setFontSize,
    setDefaultDiffMode,
    setDefaultViewMode,
    setShowLineNumbers,
    setSoundEnabled,
    setDesktopNotifications,
    resetSettings,
  } = settingsStore.getState();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogClose onClick={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SettingsIcon className="size-5" />
            Settings
          </DialogTitle>
          <DialogDescription>Customize your CodeSync experience</DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {/* Appearance Section */}
          <SettingsSection title="Appearance">
            <SettingsRow label="Theme">
              <SegmentedControl
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
                value={theme}
                onChange={(v) => setTheme(v as Theme)}
              />
            </SettingsRow>

            <SettingsRow label="Font Size">
              <SegmentedControl
                options={[
                  { value: 'sm', label: 'Small' },
                  { value: 'md', label: 'Medium' },
                  { value: 'lg', label: 'Large' },
                ]}
                value={fontSize}
                onChange={(v) => setFontSize(v as FontSize)}
              />
            </SettingsRow>
          </SettingsSection>

          {/* Editor Section */}
          <SettingsSection title="Editor">
            <SettingsRow label="Default Diff Mode">
              <SegmentedControl
                options={[
                  { value: 'unified', label: 'Unified' },
                  { value: 'split', label: 'Split' },
                ]}
                value={defaultDiffMode}
                onChange={(v) => setDefaultDiffMode(v as DiffMode)}
              />
            </SettingsRow>

            <SettingsRow label="Default View Mode">
              <SegmentedControl
                options={[
                  { value: 'diff', label: 'Diff' },
                  { value: 'code', label: 'Code' },
                ]}
                value={defaultViewMode}
                onChange={(v) => setDefaultViewMode(v as ViewMode)}
              />
            </SettingsRow>

            <SettingsRow label="Show Line Numbers">
              <Toggle checked={showLineNumbers} onChange={setShowLineNumbers} />
            </SettingsRow>
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection title="Notifications">
            <SettingsRow label="Sound Effects">
              <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
            </SettingsRow>

            <SettingsRow label="Desktop Notifications">
              <Toggle checked={desktopNotifications} onChange={setDesktopNotifications} />
            </SettingsRow>
          </SettingsSection>

          {/* Reset */}
          <div className="pt-4 border-t border-border">
            <Button variant="outline" size="sm" onClick={resetSettings} className="w-full">
              Reset to Defaults
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SettingsRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

interface SegmentedControlProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <div className="flex rounded-md border border-border overflow-hidden">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
            option.value === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-muted'
      )}
      onClick={() => onChange(!checked)}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg',
          'transform transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}
