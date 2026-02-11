/**
 * Login Form Component
 * 
 * Form for user authentication
 * 
 * Accessibility (T092, T093, T095):
 * - ARIA labels and descriptions
 * - Keyboard navigation support
 * - Focus indicators (styled via Tailwind)
 * - Form validation feedback
 * - Loading state announcements
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, LoginFormData } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.userId);
      // Redirect will happen automatically via useAuth effect
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-4"
      aria-label="Login form"
    >
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          type="text"
          placeholder="Enter your user ID or 'admin'"
          autoComplete="username"
          disabled={isLoading}
          aria-required="true"
          aria-invalid={!!errors.userId}
          aria-describedby={errors.userId ? "userId-error" : "userId-help"}
          {...register('userId')}
        />
        {errors.userId && (
          <p 
            id="userId-error" 
            className="text-sm text-red-500"
            role="alert"
          >
            {errors.userId.message}
          </p>
        )}
        <p 
          id="userId-help" 
          className="text-xs text-muted-foreground"
        >
          Enter your username or "admin" for administrator access
        </p>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Logging in...</span>
          </>
        ) : (
          'Log In'
        )}
      </Button>
    </form>
  );
}
