'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  productName: string;
  startDate?: string;
  endDate?: string;
  openQty: number;
  closeQty: number;
  diffQty: number;
  posTotalSale: number;
  variance: number;
  openStockCreatedAt?: string;
  closeStockCreatedAt?: string;
}

// Arrow Left Icon
const ArrowLeftIcon = ({ color = '#000000' }: { color?: string }) => (
  <div className="relative w-6 h-6 flex items-center justify-center">
    <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
    <div
      className="absolute left-0"
      style={{
        width: 0,
        height: 0,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        borderRight: `6px solid ${color}`,
      }}
    />
  </div>
);

export default function StockTakeLinesPage() {
  const { isAuthenticated, user, token } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [stockTakeData, setStockTakeData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storeName = user?.pos_shop_name || '';
  const stockTakeTitle = searchParams.get('title') || 'Stock Take Lines';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch stock takes data
  useEffect(() => {
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
      } catch (error: any) {
        console.error('Error fetching stock takes:', error);
        setError(error.message || 'Failed to fetch stock takes');
      } finally {
        setLoading(false);
      }
    };

    fetchStockTakes();
  }, [storeName, token]);

  // Transform stockTakeData to display format
  const stockTakeEntries: StockTakeEntry[] = useMemo(() => {
    if (!stockTakeData || !stockTakeData.items || !Array.isArray(stockTakeData.items)) {
      return [];
    }

    const entries: StockTakeEntry[] = [];

    stockTakeData.items.forEach((item: any) => {
      const startDate = item.start_date || '';
      const endDate = item.end_date || '';
      const stockTakeId = item.stock_take_id || 'unknown';

      const openStocks = item.open_stocks || [];
      const closeStocks = item.close_stocks || [];

      const productMap = new Map<string, {
        openQty: number;
        closeQty: number;
        posTotalSale: number;
        openStockCreatedAt?: string;
        closeStockCreatedAt?: string;
      }>();

      // Process open stocks
      openStocks.forEach((openStock: any) => {
        const productName = openStock.product_name || 'Unknown Product';
        const existing = productMap.get(productName) || { openQty: 0, closeQty: 0, posTotalSale: 0 };
        existing.openQty = openStock.open_qty || 0;
        existing.posTotalSale = openStock.pos_weight || 0;
        existing.openStockCreatedAt = openStock.created_at;
        productMap.set(productName, existing);
      });

      // Process close stocks
      closeStocks.forEach((closeStock: any) => {
        const productName = closeStock.product_name || 'Unknown Product';
        const existing = productMap.get(productName) || { openQty: 0, closeQty: 0, posTotalSale: 0 };
        existing.closeQty = closeStock.close_qty || 0;
        existing.closeStockCreatedAt = closeStock.created_at;
        if (existing.posTotalSale === 0) {
          existing.posTotalSale = closeStock.pos_weight || 0;
        }
        productMap.set(productName, existing);
      });

      // Create entries for each product
      let index = 0;
      productMap.forEach((data, productName) => {
        const diffQty = Math.abs(data.openQty - data.closeQty);
        const variance = diffQty - data.posTotalSale;

        entries.push({
          id: `${stockTakeId}-${index}`,
          productName: productName,
          startDate: startDate,
          endDate: endDate,
          openQty: data.openQty,
          closeQty: data.closeQty,
          diffQty: diffQty,
          posTotalSale: data.posTotalSale,
          variance: variance,
          openStockCreatedAt: data.openStockCreatedAt,
          closeStockCreatedAt: data.closeStockCreatedAt,
        });
        index++;
      });
    });

    return entries.sort((a, b) => {
      const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [stockTakeData]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
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
    router.push('/stock-take');
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
      <header className="py-4 px-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={handleBack}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <ArrowLeftIcon color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </button>
            <div className="flex-1">
              <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
                {stockTakeTitle}
              </h1>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {stockTakeEntries.length} {stockTakeEntries.length === 1 ? 'entry' : 'entries'}
              </p>
            </div>
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

      {/* Main Content */}
      <main className="px-4 py-4 h-[calc(100vh-120px)]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Loading stock take entries...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className={`text-base mb-4 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-6 rounded-lg text-base font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : stockTakeEntries.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              No stock take entries found
            </p>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                {/* Table Header */}
                <thead className={`sticky top-0 z-10 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                  <tr>
                    <th className={`px-3 py-3 text-left text-xs font-semibold min-w-24 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Start DateTime
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-semibold min-w-24 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      End DateTime
                    </th>
                    <th className={`px-3 py-3 text-left text-xs font-semibold min-w-35 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Product
                    </th>
                    <th className={`px-3 py-3 text-right text-xs font-semibold min-w-20 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Open Qty
                    </th>
                    <th className={`px-3 py-3 text-right text-xs font-semibold min-w-20 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Close Qty
                    </th>
                    <th className={`px-3 py-3 text-right text-xs font-semibold min-w-19 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Diff Qty
                    </th>
                    <th className={`px-3 py-3 text-right text-xs font-semibold min-w-22 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      PoS Total Sale
                    </th>
                    <th className={`px-3 py-3 text-right text-xs font-semibold min-w-20 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      Variance
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {stockTakeEntries.map((entry, index) => (
                    <tr
                      key={entry.id || index}
                      className={`border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}
                    >
                      <td className={`px-3 py-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        <div className="text-xs">{formatDate(entry.startDate)}</div>
                        <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatTime(entry.openStockCreatedAt)}
                        </div>
                      </td>
                      <td className={`px-3 py-3 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        <div className="text-xs">{entry.endDate ? formatDate(entry.endDate) : '-'}</div>
                        <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {entry.closeStockCreatedAt ? formatTime(entry.closeStockCreatedAt) : '-'}
                        </div>
                      </td>
                      <td className={`px-3 py-3 text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {entry.productName || '-'}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {entry.openQty.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {entry.closeQty.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {entry.diffQty.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {entry.posTotalSale.toFixed(2)}
                      </td>
                      <td className={`px-3 py-3 text-right text-xs font-medium ${
                        entry.variance < 0
                          ? 'text-red-500'
                          : entry.variance > 0
                          ? 'text-green-500'
                          : isDarkMode ? 'text-white' : 'text-black'
                      }`}>
                        {entry.variance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
