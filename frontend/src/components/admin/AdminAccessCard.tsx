/**
 * Admin Access Card Component
 * 
 * Displays individual access with user count and details
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { AccessDetailModal } from './AccessDetailModal';

interface AdminAccess {
  id: string;
  name: string;
  description: string;
  created_at: string;
  user_count: number;
  assigned_users: Array<{ id: number; username: string }>;
}

interface AdminAccessCardProps {
  access: AdminAccess;
  onUpdate?: () => void;
}

export function AdminAccessCard({ access, onUpdate }: AdminAccessCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card
        className="cursor-pointer transition-all hover:shadow-lg hover:border-purple-300"
        onClick={() => setShowModal(true)}
      >
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-mono text-sm font-semibold text-purple-900">
                {access.name}
              </h3>
            </div>
            <Badge
              variant={access.user_count > 0 ? 'default' : 'secondary'}
              className="ml-2 flex items-center gap-1"
            >
              <Users className="h-3 w-3" />
              {access.user_count}
            </Badge>
          </div>

          {/* Description */}
          <p className="mb-4 text-sm text-gray-600 line-clamp-2">
            {access.description || 'No description provided'}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {access.user_count === 0
                ? 'No users assigned'
                : access.user_count === 1
                ? '1 user assigned'
                : `${access.user_count} users assigned`}
            </span>
            <ChevronDown className="h-4 w-4 text-purple-600" />
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {showModal && (
        <AccessDetailModal
          access={access}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}
