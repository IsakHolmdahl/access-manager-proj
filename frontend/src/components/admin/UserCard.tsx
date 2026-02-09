/**
 * User Card Component
 * 
 * Displays individual user details
 */

'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Calendar } from 'lucide-react';

interface UserCardProps {
  user: {
    id: number;
    username: string;
    created_at: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  const formattedDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const isAdmin = user.username === 'admin';

  return (
    <Card className="p-4 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              isAdmin ? 'bg-purple-100' : 'bg-blue-100'
            }`}
          >
            <User
              className={`h-5 w-5 ${isAdmin ? 'text-purple-600' : 'text-blue-600'}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{user.username}</p>
              {isAdmin && (
                <Badge variant="default" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Created {formattedDate}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">ID: {user.id}</p>
        </div>
      </div>
    </Card>
  );
}
