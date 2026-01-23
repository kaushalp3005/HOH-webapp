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

interface SummaryResponse {
  store_name: string;
  start_date: string;
  end_date: string;
  open_stock_entries: any[];
  close_stock_entries: any[];
  total_open_stock: number;
  total_close_stock: number;
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
  const stockTakeTitle = searchParams.get('title') || 'Stock Take Summary';
  const startDateParam = searchParams.get('start_date');
  const endDateParam = searchParams.get('end_date');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch stock take summary using new endpoint
  useEffect(() => {
    const fetchStockData = async () => {
      if (!storeName || !token) {
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const encodedStoreName = encodeURIComponent(storeName);
        let url = `${BACKEND_URL}/api/stock-takes/summary?store_name=${encodedStoreName}`;

        // Add optional date filters if provided
        if (startDateParam) {
          url += `&start_date=${encodeURIComponent(startDateParam)}`;
        }
        if (endDateParam) {
          url += `&end_date=${encodeURIComponent(endDateParam)}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch stock take summary: ${response.status}`);
        }

        const summaryData: SummaryResponse = await response.json();

        // Transform the summary data into the expected format
        setStockTakeData({
          open_stocks: summaryData.open_stock_entries || [],
          close_stocks: summaryData.close_stock_entries || [],
          start_date: summaryData.start_date,
          end_date: summaryData.end_date,
          total_open_stock: summaryData.total_open_stock,
          total_close_stock: summaryData.total_close_stock,
        });
      } catch (error: any) {
        console.error('Error fetching stock data:', error);
        setError(error.message || 'Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [storeName, token, startDateParam, endDateParam]);

  // Transform stockTakeData to display format
  const stockTakeEntries: StockTakeEntry[] = useMemo(() => {
    if (!stockTakeData) {
      return [];
    }

    const entries: StockTakeEntry[] = [];
    const openStocks = stockTakeData.open_stocks || [];
    const closeStocks = stockTakeData.close_stocks || [];
    const startDate = stockTakeData.start_date;
    const endDate = stockTakeData.end_date;

    // Create a map to combine open and close stock by product name
    const productMap = new Map<string, {
      openQty: number;
      closeQty: number;
      posTotalSale: number;
      openStockCreatedAt?: string;
      closeStockCreatedAt?: string;
      promoterName?: string;
    }>();

    // Process open stocks
    openStocks.forEach((openStock: any) => {
      const productName = openStock.product_name || 'Unknown Product';
      const key = `${productName}-${openStock.promoter_name || 'Unknown'}`;
      const existing = productMap.get(key) || { openQty: 0, closeQty: 0, posTotalSale: 0 };
      existing.openQty = openStock.open_qty || 0;
      existing.posTotalSale = openStock.pos_weight || 0;
      existing.openStockCreatedAt = openStock.created_at;
      existing.promoterName = openStock.promoter_name;
      productMap.set(key, existing);
    });

    // Process close stocks
    closeStocks.forEach((closeStock: any) => {
      const productName = closeStock.product_name || 'Unknown Product';
      const key = `${productName}-${closeStock.promoter_name || 'Unknown'}`;
      const existing = productMap.get(key) || { openQty: 0, closeQty: 0, posTotalSale: 0 };
      existing.closeQty = closeStock.close_qty || 0;
      existing.closeStockCreatedAt = closeStock.created_at;
      if (existing.posTotalSale === 0) {
        existing.posTotalSale = closeStock.pos_weight || 0;
      }
      if (!existing.promoterName) {
        existing.promoterName = closeStock.promoter_name;
      }
      productMap.set(key, existing);
    });

    // Create entries for each product
    let index = 0;
    productMap.forEach((data, key) => {
      const productName = key.split('-')[0];
      const diffQty = Math.abs(data.openQty - data.closeQty);
      const variance = diffQty - data.posTotalSale;

      entries.push({
        id: `summary-${index}`,
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

    return entries.sort((a, b) => a.productName.localeCompare(b.productName));
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
            {/* Summary Card */}
            {stockTakeData && (
              <div className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
                <div className="flex flex-wrap gap-4 justify-between">
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date Range</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {formatDate(stockTakeData.start_date)} - {formatDate(stockTakeData.end_date)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Open Stock</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {stockTakeData.total_open_stock ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Close Stock</p>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {stockTakeData.total_close_stock ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
