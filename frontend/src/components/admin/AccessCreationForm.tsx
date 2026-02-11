/**
 * Access Creation Form Component
 * 
 * Form for creating new access types with validation
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { accessCreationSchema, AccessCreationFormData } from '@/lib/validations/access';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface AccessCreationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function AccessCreationForm({ onSuccess, onCancel }: AccessCreationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccessCreationFormData>({
    resolver: zodResolver(accessCreationSchema),
  });

  const onSubmit = async (data: AccessCreationFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/accesses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create access');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create access');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Access Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Access Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="READ_DOCUMENTS"
          disabled={isLoading}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Must be UPPERCASE with underscores (e.g., ADMIN_PANEL, VIEW_REPORTS)
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          type="text"
          placeholder="Describe what this access allows"
          disabled={isLoading}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Renewal Period (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="renewal_period">Renewal Period (days, optional)</Label>
        <Input
          id="renewal_period"
          type="number"
          placeholder="90"
          disabled={isLoading}
          {...register('renewal_period', { valueAsNumber: true })}
        />
        {errors.renewal_period && (
          <p className="text-sm text-red-500">{errors.renewal_period.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Leave empty for permanent access, or specify days until renewal required
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Access'
          )}
        </Button>
      </div>
    </form>
  );
}
