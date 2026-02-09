/**
 * Login page component - Premium glass morphism design
 */

import { useEffect, useState } from 'hono/jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { useForm } from '@/lib/form';
import { useAuth } from '../hooks/useAuth';
import { Link, navigate } from '../router';

interface LoginFormValues {
  email: string;
  password: string;
  name: string;
}

export function LoginPage() {
  const { login, register, error } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
    onSubmit: async ({ value }) => {
      const result = isRegister
        ? await register(value.email, value.password, value.name)
        : await login(value.email, value.password);

      if (result.success) {
        toast.success(isRegister ? 'Account created!' : 'Welcome back!');
        navigate('/dashboard');
      }
    },
  });

  // Show toast when auth error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleModeSwitch = () => {
    form.reset();
    setIsRegister(!isRegister);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[10%] right-[10%] w-[50%] h-[50%] rounded-full opacity-15 blur-[100px] animate-pulse-glow"
          style={{ background: 'radial-gradient(circle, oklch(0.55 0.25 259), transparent 70%)' }}
        />
        <div
          className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] rounded-full opacity-10 blur-[80px] animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.22 300), transparent 70%)',
            animationDelay: '2s',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(oklch(1 0 0 / 10%) 1px, transparent 1px), linear-gradient(to right, oklch(1 0 0 / 10%) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors glow-sm">
              <svg className="size-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-foreground tracking-tight">CodeSync</span>
          </Link>
          <p className="text-muted-foreground mt-3 text-sm">Collaborative Code Review</p>
        </div>

        {/* Form Card */}
        <div className="glass rounded-2xl p-8 glow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {isRegister ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isRegister
                ? 'Enter your details to get started'
                : 'Sign in to your account'}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-5"
          >
            {isRegister && (
              <div className="space-y-2 animate-fade-in-down">
                <Label htmlFor="name" className="text-sm font-medium text-foreground/80">
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  required={isRegister}
                  className="h-11 rounded-lg bg-background/50 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
                  {...form.getFieldProps('name')}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11 rounded-lg bg-background/50 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
                {...form.getFieldProps('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                className="h-11 rounded-lg bg-background/50 border-border/50 focus:border-primary/50 placeholder:text-muted-foreground/50"
                {...form.getFieldProps('password')}
              />
            </div>

            <Button
              type="submit"
              disabled={form.isSubmitting}
              className="w-full h-11 rounded-lg bg-primary hover:bg-primary/90 font-medium glow-sm"
            >
              {form.isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Please wait...
                </span>
              ) : isRegister ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/50 text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isRegister
                ? 'Already have an account? '
                : "Don't have an account? "}
              <span className="text-primary font-medium">
                {isRegister ? 'Sign in' : 'Register'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-muted-foreground/60 hover:text-muted-foreground text-sm transition-colors inline-flex items-center gap-1.5">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
