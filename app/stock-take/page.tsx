'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Sidebar from '@/components/sidebar';
import {
  ChatIconProfile,
  ClockIconProfile,
  SquareIconProfile,
} from '@/components/profile-icons';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://hoh-jfr9.onrender.com';

interface StockTakeEntry {
  id: string;
  title: string;
  location: string;
  startDate?: string;
  endDate?: string;
  rawData?: any;
  status?: 'completed' | 'in-progress';
  openStockCount?: number;
  closeStockCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Icon Components
const SearchIcon = ({ color = '#000000' }: { color?: string }) => (
  <div className="relative w-6 h-6">
    <div
      className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full border-2"
      style={{ borderColor: color }}
    />
    <div
      className="absolute bottom-0.5 right-0.5 w-1.5 h-0.5"
      style={{ backgroundColor: color, transform: 'rotate(45deg)' }}
    />
  </div>
);

export default function StockTakePage() {
  const { isAuthenticated, user, token } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewLoading, setViewLoading] = useState<string | null>(null);
  const [stockTakeEntries, setStockTakeEntries] = useState<StockTakeEntry[]>([]);
  const [stockTakeData, setStockTakeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const storeName = user?.pos_shop_name || '';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch stock takes on component mount
  useEffect(() => {
    if (storeName && token) {
      fetchStockTakes();
    }
  }, [storeName, token]);

  const fetchStockTakes = async () => {
    if (!storeName || !token) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const encodedStoreName = encodeURIComponent(storeName);
      const url = `${BACKEND_URL}/api/stock-takes/?skip=0&limit=100&store_name=${encodedStoreName}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stock takes: ${response.status}`);
      }

      const data = await response.json();
      setStockTakeData(data);

      // Transform API data to StockTakeEntry format
      if (data.items && Array.isArray(data.items)) {
        const entries: StockTakeEntry[] = data.items.map((item: any) => {
          const startDateFormatted = item.start_date ? formatDate(item.start_date) : 'Unknown';
          const endDateFormatted = item.end_date ? formatDate(item.end_date) : 'Ongoing';
          const title = `Stock Take ${startDateFormatted} - ${endDateFormatted}`;

          const status = item.end_date && item.close_stock_count > 0 ? 'completed' : 'in-progress';

          return {
            id: item.stock_take_id || '',
            title: title,
            location: item.store_name || storeName,
            startDate: item.start_date || '',
            endDate: item.end_date || '',
            rawData: item,
            status: status,
            openStockCount: item.open_stock_count || 0,
            closeStockCount: item.close_stock_count || 0,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          };
        });

        // Sort by start date (most recent first)
        entries.sort((a, b) => {
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateB - dateA;
        });

        setStockTakeEntries(entries);
      } else {
        setStockTakeEntries([]);
      }
    } catch (error: any) {
      console.error('Error fetching stock takes:', error);
      setError(error.message || 'Failed to fetch stock takes');
      setStockTakeEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  const handleOpenQty = () => {
    router.push('/stock-take/open');
  };

  const handleCloseQty = () => {
    // Find the most recent stock take
    const sortedStockTakes = [...stockTakeEntries].sort((a, b) => {
      const endDateA = a.endDate ? new Date(a.endDate).getTime() : 0;
      const endDateB = b.endDate ? new Date(b.endDate).getTime() : 0;
      if (endDateB !== endDateA) {
        return endDateB - endDateA;
      }
      const startDateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const startDateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      if (startDateB !== startDateA) {
        return startDateB - startDateA;
      }
      return (b.id || '').localeCompare(a.id || '');
    });

    const mostRecentStockTake = sortedStockTakes[0];
    const stockTakeId = mostRecentStockTake?.id || '';

    console.log('Selected most recent stock take for close:', {
      id: stockTakeId,
      title: mostRecentStockTake?.title,
      startDate: mostRecentStockTake?.startDate,
      endDate: mostRecentStockTake?.endDate,
    });

    router.push(`/stock-take/close?id=${stockTakeId}`);
  };

  const handleView = () => {
    if (stockTakeData) {
      setViewLoading('view-all');
      // Use the most recent stock take title or a default title
      const title = stockTakeEntries.length > 0
        ? stockTakeEntries[0].title
        : 'Stock Take Overview';
      router.push(`/stock-take/lines?title=${encodeURIComponent(title)}`);
    }
  };

  const handleProfile = () => {
    setSidebarVisible(false);
    router.push('/profile');
  };

  const handleLogout = () => {
    setSidebarVisible(false);
    router.push('/login');
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
    if (searchVisible) {
      setSearchText('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onProfileClick={handleProfile}
        onLogout={handleLogout}
        onHomeClick={handleBack}
      />

      {/* Header */}
      <header className="py-4 px-5">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Stock Take Overview
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ChatIconProfile notificationCount={2} />
            <ClockIconProfile />
            <button onClick={() => setSidebarVisible(true)}>
              <SquareIconProfile />
            </button>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="flex justify-end items-center px-5 pb-4 gap-3">
        {searchVisible && (
          <input
            type="text"
            className={`h-10 rounded-lg px-3 text-base border transition-all ${
              isDarkMode
                ? 'bg-gray-800 text-white border-gray-600'
                : 'bg-gray-100 text-black border-gray-300'
            } ${searchVisible ? 'w-64' : 'w-0'}`}
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            autoFocus
          />
        )}
        <button onClick={toggleSearch} className="p-1">
          <SearchIcon color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </button>
      </div>

      {/* Main Content */}
      <main className="px-5 pb-5">
        {/* Create New Stock Take Card */}
        <div
          className={`rounded-xl p-5 mb-4 border-2 border-dashed border-purple-600 ${
            isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
          }`}
        >
          <h2 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
            Create New Stock Take
          </h2>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {storeName}
          </p>
          <div className="flex gap-3 mt-2">
            <button
              onClick={handleOpenQty}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Open Qty
            </button>
            <button
              onClick={handleCloseQty}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg text-sm font-medium transition-colors"
            >
              Close Qty
            </button>
            <button
              onClick={handleView}
              disabled={viewLoading === 'view-all' || loading || !stockTakeData}
              className={`flex-1 border-2 border-purple-600 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                viewLoading === 'view-all' || loading || !stockTakeData
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode
                  ? 'bg-gray-900 text-white hover:bg-gray-800'
                  : 'bg-gray-100 text-black hover:bg-gray-200'
              }`}
            >
              {viewLoading === 'view-all' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                'View'
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Loading previous stock takes...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <p className={`text-base mb-4 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {error}
            </p>
            <button
              onClick={fetchStockTakes}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg text-base font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
