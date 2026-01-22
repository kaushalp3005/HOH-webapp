'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeftIcon,
  ChatIconProfile,
  ClockIconProfile,
  SquareIconProfile,
} from '@/components/profile-icons';

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const handleBack = () => {
    router.back();
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      {/* Main Header */}
      <header
        className={`flex justify-between items-center px-4 py-3 pt-12 ${
          isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <button onClick={handleBack} className="hover:opacity-70 transition-opacity">
            <ArrowLeftIcon color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <ChatIconProfile notificationCount={2} />
          <ClockIconProfile color={isDarkMode ? '#CCCCCC' : '#666666'} />
          <button className="hover:opacity-70 transition-opacity">
            <SquareIconProfile size="small" />
          </button>
        </div>
      </header>

      {/* Profile Content */}
      <div className="p-4">
        {/* Profile Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {user.pos_shop_name || user.name || 'Shop Name'}
          </h1>
        </div>

        {/* Contact and Work Information */}
        <div className="mb-6">
          <div className="flex justify-between items-center py-2">
            <span className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Company
            </span>
            <span className="text-base text-green-500 font-medium">
              {user.company || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Work Email
            </span>
            <span className="text-base text-green-500 font-medium">
              {user.email || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Users
            </span>
            <span className="text-base text-green-500 font-medium">
              {user.users || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
