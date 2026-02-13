/**
 * Access Card Component - Displays suggested accesses as interactive cards
 * Feature: 003-frontend-chat
 */

'use client';

import React, { useState } from 'react';
import { Check, Shield, Loader2 } from 'lucide-react';
import { AccessSuggestion } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccessCardProps {
  access: AccessSuggestion;
  onGrant: (accessName: string) => void;
  isGranting?: boolean;
  variant?: 'suggestion' | 'granted';
}

export function AccessCard({
  access,
  onGrant,
  isGranting = false,
  variant = 'suggestion',
}: AccessCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (variant === 'granted') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50',
          'animate-fade-in'
        )}
        role="status"
      >
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <Check size={16} className="text-green-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-green-800 truncate">
            {access.name}
          </p>
          <p className="text-sm text-green-600 truncate">
            {access.description}
          </p>
        </div>
        
        <span className="text-xs font-medium text-green-600 px-2 py-1 bg-green-100 rounded">
          Granted
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border transition-all duration-200',
        'hover:shadow-md hover:border-blue-300 cursor-pointer',
        'bg-white border-gray-200',
        isHovered && 'ring-2 ring-blue-100 border-blue-300'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !isGranting && onGrant(access.name)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          !isGranting && onGrant(access.name);
        }
      }}
      aria-label={`Grant access: ${access.name}. ${access.description}`}
    >
      {/* Icon */}
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
        isHovered ? 'bg-blue-100' : 'bg-gray-100'
      )}>
        <Shield
          size={20}
          className={cn(
            'transition-colors',
            isHovered ? 'text-blue-600' : 'text-gray-500'
          )}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">
          {access.name}
        </h4>
        <p className="text-sm text-gray-500 line-clamp-2">
          {access.description}
        </p>
      </div>

      {/* Action Button */}
      <div className="flex-shrink-0">
        {isGranting ? (
          <Button
            variant="ghost"
            size="sm"
            disabled
            className="opacity-50"
          >
            <Loader2 size={16} className="animate-spin" />
          </Button>
        ) : (
          <Button
            variant={isHovered ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'transition-all',
              isHovered
                ? 'bg-blue-600 text-white'
                : 'text-blue-600 border-blue-200 hover:bg-blue-50'
            )}
          >
            Grant
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Access Grid Component - Displays multiple access cards
// ============================================================================

interface AccessGridProps {
  accesses: AccessSuggestion[];
  onGrant: (accessName: string) => void;
  grantedAccesses?: string[];
  isGranting?: string | null;
}

export function AccessGrid({
  accesses,
  onGrant,
  grantedAccesses = [],
  isGranting = null,
}: AccessGridProps) {
  if (accesses.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
      {accesses.map((access) => (
        <AccessCard
          key={access.id}
          access={access}
          onGrant={onGrant}
          isGranting={isGranting === access.name}
          variant={grantedAccesses.includes(access.name) ? 'granted' : 'suggestion'}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Access Badge Component - Simple badge for displaying access names
// ============================================================================

interface AccessBadgeProps {
  name: string;
  granted?: boolean;
  onRemove?: () => void;
}

export function AccessBadge({ name, granted = false, onRemove }: AccessBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
        granted
          ? 'bg-green-100 text-green-700'
          : 'bg-blue-100 text-blue-700'
      )}
    >
      {granted && <Check size={12} />}
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-red-600"
          aria-label={`Remove ${name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}
