'use client';

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Sidebar from '@/components/sidebar';
import BarcodeScanner from '@/components/barcode-scanner';
import {
  ChatIconProfile,
  ClockIconProfile,
  SquareIconProfile,
} from '@/components/profile-icons';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://hoh-jfr9.onrender.com';

interface ScannedItem {
  id: string;
  sequence: number;
  product: string;
  weight: number;
  article_code: number;
  price: number;
  gst?: number;
}

// Icon Components
const BarcodeIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <div className="flex items-center justify-center gap-0.5">
    <div className="h-4" style={{ backgroundColor: color, width: '2px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '4px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '2px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '6px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '2px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '4px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '3px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '5px' }} />
  </div>
);

const ListIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <div className="flex flex-col justify-between h-4">
    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
    <div className="w-4 h-0.5 rounded" style={{ backgroundColor: color }} />
  </div>
);

const CrossIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <div className="relative w-5 h-5 flex items-center justify-center">
    <div
      className="absolute w-3.5 h-0.5 rounded"
      style={{ backgroundColor: color, transform: 'rotate(45deg)' }}
    />
    <div
      className="absolute w-3.5 h-0.5 rounded"
      style={{ backgroundColor: color, transform: 'rotate(-45deg)' }}
    />
  </div>
);

export default function OpenStockTakePage() {
  const { isAuthenticated, user, token } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);

  // Scanner state
  const [isScanning, setIsScanning] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

  // Modal states
  const [viewItemsVisible, setViewItemsVisible] = useState(false);
  const [promoterModalVisible, setPromoterModalVisible] = useState(false);
  const [fullValueModalVisible, setFullValueModalVisible] = useState(false);

  // Form states
  const [promoterName, setPromoterName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [fullValueText, setFullValueText] = useState('');

  // Refs
  const lastScannedBarcodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const isProcessingRef = useRef(false);

  const storeName = user?.pos_shop_name || 'Store';
  const scanCooldown = 500;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Process barcode scan
  const processBarcode = useCallback(async (barcodeData: string) => {
    const currentTime = Date.now();

    if (isProcessingRef.current) {
      console.log('Already processing a scan - please wait');
      return;
    }

    if (!barcodeData || typeof barcodeData !== 'string' || barcodeData.trim().length === 0) {
      console.log('Empty barcode - rejecting');
      return;
    }

    if ((currentTime - lastScannedTimeRef.current) < scanCooldown) {
      console.log('Cooldown active - please wait');
      return;
    }

    console.log('Processing barcode:', barcodeData);

    lastScannedBarcodeRef.current = barcodeData;
    lastScannedTimeRef.current = currentTime;

    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      const requestPayload = {
        barcode: barcodeData,
        store_name: storeName,
      };

      console.log('Sending to backend:', {
        endpoint: `${BACKEND_URL}/api/article-codes/barcode-scan`,
        barcode: barcodeData,
        store_name: storeName,
      });

      const backendResponse = await fetch(`${BACKEND_URL}/api/article-codes/barcode-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (backendResponse.ok) {
        const result = await backendResponse.json();
        console.log('Backend response:', result);

        const productName = result.product;
        const articleCode = result.article_code;
        const itemWeight = result.weight || 0;
        const itemPrice = result.price_with_gst || (result.price || 0) * (1 + (result.gst || 0));
        const itemGst = result.gst || 0;

        setScannedItems(prevItems => {
          const existingItem = prevItems.find(item => item.article_code === articleCode);

          if (existingItem) {
            return prevItems.map(item =>
              item.article_code === articleCode
                ? { ...item, weight: item.weight + itemWeight }
                : item
            );
          } else {
            const newItem: ScannedItem = {
              id: Date.now().toString(),
              sequence: prevItems.length + 1,
              product: productName,
              weight: itemWeight,
              article_code: articleCode,
              price: itemPrice,
              gst: itemGst,
            };
            return [...prevItems, newItem];
          }
        });
      } else {
        const error = await backendResponse.json();
        const errorMessage = error.detail || 'Failed to fetch barcode details';

        console.error('Backend error:', errorMessage);

        alert(
          `Article Not Found\n\n${errorMessage}\n\nBarcode: ${barcodeData}\n\nYou can continue scanning other items.`
        );
      }
    } catch (error) {
      console.error('Error fetching product from backend:', error);
      alert('Scan Error\n\nFailed to fetch product details. Please try again.');
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      console.log('Processing complete - ready for next scan');
    }
  }, [storeName, token]);

  // Handle barcode detected from scanner
  const handleBarcodeDetected = useCallback((barcodeData: string) => {
    if (!isScanning || isProcessingRef.current) {
      console.log('Scan blocked - scanner paused or processing');
      return;
    }
    processBarcode(barcodeData);
  }, [isScanning, processBarcode]);

  const handleStop = () => {
    setIsScanning(prev => !prev);
  };

  const handleClose = () => {
    router.push('/stock-take');
  };

  const handleViewItems = () => {
    setViewItemsVisible(true);
  };

  const handleCloseViewItems = () => {
    setViewItemsVisible(false);
    setSearchQuery('');
  };

  const handleLongPress = (value: any) => {
    const stringValue = String(value);
    if (stringValue.length > 15) {
      setFullValueText(stringValue);
      setFullValueModalVisible(true);
    }
  };

  const truncateText = (text: any, maxLength: number): string => {
    const str = String(text);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  };

  const handleValidate = () => {
    setIsScanning(false);
    setPromoterModalVisible(true);
  };

  const handlePromoterNameSubmit = async () => {
    if (!promoterName.trim()) {
      alert('Validation Error\n\nPlease enter a promoter name');
      return;
    }

    if (scannedItems.length === 0) {
      alert('No Items\n\nPlease scan at least one item before submitting.');
      return;
    }

    try {
      setIsProcessing(true);

      const uppercasePromoterName = promoterName.trim().toUpperCase();

      const payload = {
        store_name: storeName,
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        open_stock_entries: scannedItems.map(item => ({
          product_name: item.product,
          promoter_name: uppercasePromoterName,
          open_qty: item.weight,
        })),
      };

      console.log('Sending open stock payload:', payload);

      const response = await fetch(`${BACKEND_URL}/api/stock-takes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Open stock take created:', result);

        setPromoterModalVisible(false);
        handleCloseViewItems();

        alert('Success\n\nOpen stock take entry created successfully!');
        router.push('/stock-take');
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.detail || 'Failed to create open stock take';

        console.error('Open stock error:', errorMessage);
        alert(`Error\n\n${errorMessage}`);
      }
    } catch (error) {
      console.error('Error creating open stock:', error);
      alert('Error\n\nFailed to create open stock take. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromoterModalClose = () => {
    setPromoterModalVisible(false);
    setPromoterName('');
    setIsScanning(true);
  };

  const handleRemoveItem = (itemId: string) => {
    setScannedItems(prevItems => {
      const filteredItems = prevItems.filter(item => item.id !== itemId);
      return filteredItems.map((item, index) => ({
        ...item,
        sequence: index + 1,
      }));
    });
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return scannedItems;

    const query = searchQuery.toLowerCase();
    return scannedItems.filter(item =>
      item.product.toLowerCase().includes(query) ||
      item.sequence.toString().includes(query) ||
      item.weight.toString().includes(query)
    );
  }, [scannedItems, searchQuery]);

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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-black">
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onProfileClick={handleProfile}
        onLogout={handleLogout}
        onHomeClick={handleBack}
      />

      {/* Header */}
      <header className="flex justify-end items-center px-4 py-3 gap-3 shrink-0">
        <button
          onClick={handleStop}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2.5 rounded-lg transition-colors"
        >
          <BarcodeIcon color="#FFFFFF" />
          <span className="text-white text-sm font-medium">
            {isScanning ? 'Stop' : 'Resume'}
          </span>
        </button>
        <button
          onClick={handleClose}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2.5 rounded-full transition-colors"
        >
          <CrossIcon color="#FFFFFF" />
          <span className="text-white text-sm font-medium">Close</span>
        </button>
      </header>

      {/* Scanner View */}
      <div className="flex-1 relative min-h-0">
        {isProcessing && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-3"></div>
            <p className="text-white text-base font-medium">Processing...</p>
          </div>
        )}

        {!isScanning && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-10">
            <p className="text-white text-lg font-medium mb-2">Scanner Paused</p>
            <p className="text-gray-400 text-sm">Click Resume to continue scanning</p>
          </div>
        )}

        <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
      </div>

      {/* View Items Button */}
      <div className="px-4 py-4 shrink-0">
        <button
          onClick={handleViewItems}
          className="w-full flex items-center justify-center gap-3 bg-purple-600 hover:bg-purple-700 py-4 rounded-lg transition-colors"
        >
          <ListIcon color="#FFFFFF" />
          <span className="text-white text-base font-medium">
            View Items {scannedItems.length > 0 && `(${scannedItems.length})`}
          </span>
        </button>
      </div>

      {/* View Items Modal (Bottom Sheet) */}
      {viewItemsVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
          <div
            className="bg-white rounded-t-3xl w-full max-h-[85%] flex flex-col animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0">
              <div className="flex-1">
                <h2 className="text-base font-semibold text-purple-600">
                  Open Stock Take: {storeName}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  {scannedItems.length} items
                </span>
                <button
                  onClick={handleCloseViewItems}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <CrossIcon color="#666666" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-200 shrink-0">
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-gray-100 rounded-lg px-4 py-2.5 text-sm text-gray-800 pr-10"
                  placeholder="Search by product, weight, or S.No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery.length > 0 && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center hover:bg-gray-500"
                  >
                    <span className="text-white text-xs font-bold">×</span>
                  </button>
                )}
              </div>
            </div>

            {/* Table Header */}
            <div className="flex bg-gray-50 border-b-2 border-purple-600 px-4 py-3 shrink-0">
              <div className="w-16 text-xs font-semibold text-gray-700">S.No</div>
              <div className="flex-1 text-xs font-semibold text-gray-700">Product</div>
              <div className="w-24 text-xs font-semibold text-gray-700 text-right">Weight (kg)</div>
              <div className="w-12 text-xs font-semibold text-gray-700 text-center">Action</div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {filteredItems.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                  <p className="text-gray-500 text-sm">
                    {searchQuery ? 'No items match your search' : 'No items scanned yet'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="w-16 text-sm text-gray-800">{item.sequence}</div>
                    <button
                      className="flex-1 text-left"
                      onClick={() => item.product.length > 20 && handleLongPress(item.product)}
                    >
                      <span className="text-sm text-gray-800">
                        {truncateText(item.product, 25)}
                      </span>
                    </button>
                    <div className="w-24 text-sm text-gray-800 text-right">
                      {item.weight.toFixed(3)}
                    </div>
                    <div className="w-12 flex justify-center">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-600 text-xl font-light"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Validate Button */}
            <div className="p-4 border-t border-gray-200 shrink-0">
              <button
                onClick={handleValidate}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-lg text-base font-medium transition-colors"
              >
                Validate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promoter Name Modal */}
      {promoterModalVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handlePromoterModalClose}
        >
          <div
            className="bg-white rounded-xl p-5 w-full max-w-md max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">
              Enter Promoter Name
            </h2>

            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 mb-4 uppercase"
              placeholder="Promoter Name"
              value={promoterName}
              onChange={(e) => setPromoterName(e.target.value.toUpperCase())}
              autoFocus
            />

            <h3 className="text-base font-semibold text-gray-800 mb-3">
              Entries to Submit ({scannedItems.length})
            </h3>

            <div className="flex-1 overflow-y-auto max-h-60 mb-4 min-h-0">
              {scannedItems.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-5">No items scanned</p>
              ) : (
                scannedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center bg-gray-50 rounded-lg p-3 mb-2"
                  >
                    <div className="flex-1 mr-2 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.product}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.weight.toFixed(3)} kg
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center hover:bg-red-200"
                    >
                      <span className="text-red-500 text-lg font-light">×</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3 shrink-0">
              <button
                onClick={handlePromoterModalClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg text-base font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePromoterNameSubmit}
                disabled={isProcessing}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-base font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Value Modal */}
      {fullValueModalVisible && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setFullValueModalVisible(false)}
        >
          <div
            className="bg-white rounded-xl p-5 w-full max-w-md max-h-[60%] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-800 text-center mb-4">
              Full Value
            </h2>
            <div className="flex-1 overflow-y-auto mb-4 min-h-0">
              <p className="text-sm text-gray-800 leading-relaxed break-words">
                {fullValueText}
              </p>
            </div>
            <button
              onClick={() => setFullValueModalVisible(false)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg text-base font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
