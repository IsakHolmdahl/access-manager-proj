/**
 * Hamburger Menu Component
 * 
 * T071 - Mobile hamburger menu for secondary actions
 * Provides access to additional options on mobile devices
 */

'use client';

import { useState } from 'react';
import { Menu, X, RefreshCw, Info, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MenuItem {
  name: string;
  icon: typeof RefreshCw;
  action: () => void;
  description?: string;
}

interface HamburgerMenuProps {
  items?: MenuItem[];
  onRefresh?: () => void;
}

export function HamburgerMenu({ items, onRefresh }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const defaultItems: MenuItem[] = [
    ...(onRefresh ? [{
      name: 'Refresh',
      icon: RefreshCw,
      action: () => {
        onRefresh();
        setIsOpen(false);
      },
      description: 'Reload current data',
    }] : []),
    {
      name: 'About',
      icon: Info,
      action: () => {
        alert('Access Management System v1.0');
        setIsOpen(false);
      },
      description: 'About this app',
    },
    {
      name: 'Documentation',
      icon: FileText,
      action: () => {
        window.open('/api/health', '_blank');
        setIsOpen(false);
      },
      description: 'View API docs',
    },
  ];

  const menuItems = items || defaultItems;

  return (
    <div className="lg:hidden">
      {/* Hamburger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu Panel */}
      <div
        id="mobile-menu"
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-label="Mobile menu"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={item.action}
                  className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors text-left"
                >
                  <Icon className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    {item.description && (
                      <div className="text-sm text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
