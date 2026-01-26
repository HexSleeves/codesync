/**
 * Login page component - uses TanStack Form
 */

import { useEffect, useState } from 'hono/jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Show toast when auth error changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

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

  const handleModeSwitch = () => {
    form.reset();
    setIsRegister(!isRegister);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">CodeSync</h1>
          <p className="text-muted-foreground mt-2">Collaborative Code Review</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isRegister ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isRegister
                ? 'Enter your details to create an account'
                : 'Enter your credentials to sign in'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {isRegister && (
                <form.Field name="name">
                  {(field: any) => (
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={field.state.value}
                        onInput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                        onBlur={field.handleBlur}
                        placeholder="Your name"
                        required={isRegister}
                      />
                    </div>
                  )}
                </form.Field>
              )}

              <form.Field name="email">
                {(field: any) => (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={field.state.value}
                      onInput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                      onBlur={field.handleBlur}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="password">
                {(field: any) => (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={field.state.value}
                      onInput={(e) => field.handleChange((e.target as HTMLInputElement).value)}
                      onBlur={field.handleBlur}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(state: any) => state.isSubmitting}>
                {(isSubmitting: boolean) => (
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <div className="mt-6 text-center">
              <Button variant="link" onClick={handleModeSwitch}>
                {isRegister
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Register"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center">
          <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
