'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Sidebar from '@/components/sidebar';
import {
  ChatIcon,
  ClockIcon,
  SquareIcon,
  PointOfSaleIcon,
  StockTakeIcon,
} from '@/components/dashboard-icons';

interface DashboardBoxProps {
  title: string;
  icon: React.ReactNode;
  onPress?: () => void;
}

const DashboardBox = ({ title, icon, onPress }: DashboardBoxProps) => {
  const { isDarkMode } = useTheme();
  
  return (
    <button
      onClick={onPress}
      className={`w-full max-w-37.5 min-h-35 rounded-xl p-5 flex flex-col items-center justify-center transition-all hover:scale-105 shadow-md hover:shadow-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}
    >
      <div className="mb-3 h-15 w-15 flex items-center justify-center">
        {icon}
      </div>
      <p className={`text-sm font-medium text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        {title}
      </p>
    </button>
  );
};

export default function DashboardPage() {
  const { isAuthenticated, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const handlePointOfSale = () => {
    // Navigate to Point of Sale page
    router.push('/pos');
  };

  const handleStockTake = () => {
    // Navigate to Stock Take page
    router.push('/stock-take');
  };

  const handleProfile = () => {
    setSidebarVisible(false);
    router.push('/profile');
  };

  const handleLogout = () => {
    setSidebarVisible(false);
    logout();
    router.push('/login');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-gray-100'}`}>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onProfileClick={handleProfile}
        onLogout={handleLogout}
        onHomeClick={() => setSidebarVisible(false)}
      />

      {/* Header */}
      <header className={`py-5 px-5 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'}`}>
        <div className="flex justify-end items-center gap-4">
          <ChatIcon hasNotification={true} />
          <ClockIcon />
          <button onClick={() => setSidebarVisible(true)}>
            <SquareIcon />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pt-10">
        <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto">
          <DashboardBox
            title="Point Of Sale"
            icon={<PointOfSaleIcon />}
            onPress={handlePointOfSale}
          />
          <DashboardBox
            title="Stock Take"
            icon={<StockTakeIcon />}
            onPress={handleStockTake}
          />
        </div>
      </main>
    </div>
  );
}
