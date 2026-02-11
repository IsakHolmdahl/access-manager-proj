/**
 * Access Card Component
 * 
 * Displays individual access information
 */

import { AccessCardProps } from '@/types';
import { formatAccessName, formatAccessDate } from '@/types/access';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key } from 'lucide-react';

export function AccessCard({ access, showUserCount, onClick }: AccessCardProps) {
  return (
    <Card
      className={`transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <Key className="h-5 w-5 text-primary" />
          {showUserCount && access.user_count !== undefined && (
            <Badge variant="secondary">
              {access.user_count} {access.user_count === 1 ? 'user' : 'users'}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{formatAccessName(access.name)}</CardTitle>
        {access.description && (
          <CardDescription className="line-clamp-2">{access.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Granted {formatAccessDate(access.created_at)}
        </p>
      </CardContent>
    </Card>
  );
}
