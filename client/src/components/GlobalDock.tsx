import React, { useState } from 'react';
import { Home, Shirt, Video, MessageSquare, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';
import { cn } from '@/lib/utils';

export default function GlobalDock() {
  const [location, setLocation] = useLocation();

  // Only hide dock on auth pages
  const hiddenRoutes = ['/auth', '/onboarding'];
  const shouldHideDock = hiddenRoutes.includes(location);

  // Don't render dock at all on hidden routes
  if (shouldHideDock) {
    return null;
  }

  const navigationItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/app',
      isActive: location === '/app' || location === '/'
    },
    {
      icon: Shirt,
      label: 'Dress',
      path: '/dress-tryon',
      isActive: location === '/dress-tryon'
    },
    {
      icon: Video,
      label: 'Live',
      path: '/routine',
      isActive: location === '/routine'
    },
    {
      icon: MessageSquare,
      label: 'Coach',
      path: '/interview-coach',
      isActive: location === '/interview-coach'
    },
    {
      icon: Calendar,
      label: 'Calendar',
      path: '/calendar',
      isActive: location === '/calendar'
    }
  ];

  const handleNavigation = (path: string) => {
    setLocation(path);
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 max-w-md mx-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-all duration-200 min-w-[64px]",
                  item.isActive
                    ? "bg-purple-50 text-purple-600"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                <Icon className={cn("h-6 w-6 mb-1")} />
                <span className={cn(
                  "text-xs font-medium leading-none",
                  item.isActive ? "text-purple-600" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add bottom padding to prevent content from being hidden behind the nav */}
      <div className="h-20" />
    </>
  );
} 