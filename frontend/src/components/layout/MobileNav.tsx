/**
 * Mobile Navigation Component
 * 
 * T070 - Bottom navigation for mobile devices
 * Provides easy access to main sections on small screens
 */

'use client';

import { Home, Settings, User, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  name: string;
  icon: typeof Home;
  href: string;
  action?: () => void;
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navItems: NavItem[] = [
    {
      name: 'Home',
      icon: Home,
      href: '/',
    },
    ...(session.role === 'admin' ? [{
      name: 'Admin',
      icon: Settings,
      href: '/admin',
    }] : []),
    {
      name: 'Profile',
      icon: User,
      href: '/', // Could be /profile in future
    },
    {
      name: 'Logout',
      icon: LogOut,
      href: '#',
      action: handleLogout,
    },
  ];

  // Don't show on login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  router.push(item.href);
                }
              }}
              className={cn(
                'flex flex-col items-center justify-center min-w-[60px] h-full rounded-lg transition-colors',
                'hover:bg-gray-100 active:bg-gray-200',
                'focus-visible:outline-2 focus-visible:outline-ring',
                isActive && 'text-primary'
              )}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn(
                'h-6 w-6 mb-1',
                isActive ? 'text-primary' : 'text-gray-600'
              )} />
              <span className={cn(
                'text-xs',
                isActive ? 'font-semibold text-primary' : 'text-gray-600'
              )}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
