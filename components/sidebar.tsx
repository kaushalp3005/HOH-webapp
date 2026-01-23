'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  onHomeClick?: () => void;
}

export default function Sidebar({
  visible,
  onClose,
  onProfileClick,
  onLogout,
  onHomeClick,
}: SidebarProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useAuth();

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-80 z-50 shadow-2xl transition-transform ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className={`self-end text-2xl mb-6 ${
              isDarkMode ? 'text-white hover:text-gray-300' : 'text-gray-800 hover:text-gray-600'
            }`}
          >
            ×
          </button>

          {/* User Info */}
          {user && (
            <div className={`mb-8 pb-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {user.name || 'User'}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user.email}
              </p>
            </div>
          )}

          {/* Menu Items */}
          <nav className="flex-1 space-y-2">
            {onHomeClick && (
              <button
                onClick={onHomeClick}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'text-white hover:bg-gray-800'
                    : 'text-gray-800 hover:bg-gray-100'
                }`}
              >
                🏠 Home
              </button>
            )}
            <button
              onClick={onProfileClick}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-800 hover:bg-gray-100'
              }`}
            >
              👤 Profile
            </button>
            <button
              onClick={toggleTheme}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                isDarkMode
                  ? 'text-white hover:bg-gray-800'
                  : 'text-gray-800 hover:bg-gray-100'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
          </nav>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors mt-auto"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </>
  );
}
