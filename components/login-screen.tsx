'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface LoginScreenProps {
  onLogin: () => void;
}

// Eye Icon Components
const EyeIcon = ({ color = '#666' }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7-3.636-7-10-7z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeOffIcon = ({ color = '#666' }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 3l18 18M10.584 10.587a2 2 0 002.828 2.829M9.363 5.365A9.466 9.466 0 0112 5c7 0 10 7 10 7a13.16 13.16 0 01-1.365 2.147m-2.812 2.59C16.503 17.39 14.376 18 12 18c-7 0-10-7-10-7a13.16 13.16 0 012.057-2.815"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { isDarkMode } = useTheme();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate credentials
    if (email.trim() === '' || password.trim() === '') {
      setError('Please enter both email and password');
      return;
    }

    try {
      await login(email, password);
      console.log('Login successful');
      onLogin();
    } catch (err: any) {
      // Show appropriate error message based on error type
      const errorMessage = err.message || 'Invalid email or password';

      // Customize error messages for common scenarios
      if (errorMessage.toLowerCase().includes('password')) {
        setError('The password you entered is incorrect. Please try again.');
      } else if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('not found')) {
        setError('No account found with this email. Please check your email and try again.');
      } else if (errorMessage.toLowerCase().includes('invalid')) {
        setError('The email or password you entered is incorrect. Please try again.');
      } else {
        setError(errorMessage);
      }
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="w-full max-w-md px-5 sm:px-8 md:px-12 py-8 sm:py-10 md:py-12">
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-8 sm:mb-10 md:mb-12">
            <div className="w-20 h-20 sm:w-30 sm:h-30 md:w-36 md:h-36 relative">
              <Image
                src="/logo.jpg"
                alt="HOH Logo"
                width={150}
                height={150}
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h1 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to HOH
            </h1>
            <p className={`text-sm sm:text-base md:text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Sign in to continue
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label 
              htmlFor="email"
              className={`block text-sm sm:text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={`w-full h-11 sm:h-12 md:h-14 px-3 sm:px-4 text-sm sm:text-base md:text-lg rounded-lg border transition-colors ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label 
              htmlFor="password"
              className={`block text-sm sm:text-base font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-700'
              }`}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className={`w-full h-11 sm:h-12 md:h-14 px-3 sm:px-4 pr-12 text-sm sm:text-base md:text-lg rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
              >
                {showPassword ? (
                  <EyeOffIcon color={isDarkMode ? '#999999' : '#666'} />
                ) : (
                  <EyeIcon color={isDarkMode ? '#999999' : '#666'} />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full h-11 sm:h-12 md:h-14 bg-blue-500 hover:bg-blue-600 text-white text-sm sm:text-base md:text-lg font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-6 ${
              isLoading ? 'flex items-center justify-center' : ''
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Login'
            )}
          </button>

          {/* Footer */}
          <p className={`text-xs sm:text-sm text-center mt-8 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            © 2024 HOH. All rights reserved.
          </p>
        </form>
      </div>
    </div>
  );
}
