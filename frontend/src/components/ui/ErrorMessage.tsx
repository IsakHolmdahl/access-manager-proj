/**
 * Error Message Component
 * 
 * Displays error messages with optional retry action
 */

import { cn } from '@/lib/utils';
import { ErrorMessageProps } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export function ErrorMessage({ message, onRetry, className }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className={cn(className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
