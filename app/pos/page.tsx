'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Product interface matching API response
interface Product {
  ykey: string;
  article: string;
  price?: number;
  rate?: number;
  weight?: number;
  gst?: number;
}

interface CartItem {
  ykey: string;
  product: string;
  quantity: number;
  price: number;
  unitPrice?: number; // Price per unit (e.g., per kg)
  unit: string;
  discount?: number;
}

interface Order {
  id: string;
  orderNumber: number;
  items: CartItem[];
  createdAt: Date;
}

// Scanned item from barcode scanner
interface ScannedItem {
  id: string;
  barcode: string;
  product: string;
  price: number;
  pricePerKg: number;
  weight: number;
  gst: number;
  article_code?: number;
  weight_code?: string;
  barcode_format?: string;
  store_name?: string;
  pricelist?: string;
  timestamp: string;
}

interface ScannerPage {
  id: string;
  storeName: string;
  scannedItems: ScannedItem[];
}

// Module-level cache - persists in RAM until page reload
let globalProductsCache: { loaded: boolean; data: Product[]; storeName: string } = {
  loaded: false,
  data: [],
  storeName: '',
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://hoh-jfr9.onrender.com';
const PRODUCT_PRICE = 1000;

// Icon Components
const HamburgerIcon = ({ color = '#FFFFFF' }: { color?: string }) => (
  <div className="w-6 h-6 flex flex-col justify-between py-1.5">
    <div className="w-6 h-0.5 rounded" style={{ backgroundColor: color }} />
    <div className="w-6 h-0.5 rounded" style={{ backgroundColor: color }} />
    <div className="w-6 h-0.5 rounded" style={{ backgroundColor: color }} />
  </div>
);

const EllipsisIcon = ({ color = '#CCCCCC' }: { color?: string }) => (
  <div className="flex flex-col gap-0.5 p-1">
    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
    <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
  </div>
);

const PlusIcon = ({ color = '#4A90E2' }: { color?: string }) => (
  <div className="relative w-5 h-5 flex items-center justify-center">
    <div className="absolute w-5 h-5 rounded-full border-2" style={{ borderColor: color }} />
    <div className="absolute w-2.5 h-0.5" style={{ backgroundColor: color }} />
    <div className="absolute w-0.5 h-2.5" style={{ backgroundColor: color }} />
  </div>
);

const DownArrowIcon = ({ color = '#4A90E2' }: { color?: string }) => (
  <div className="w-5 h-5 flex items-center justify-center">
    <div
      className="w-0 h-0"
      style={{
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: `10px solid ${color}`,
      }}
    />
  </div>
);

const SearchIcon = ({ color = '#4A90E2' }: { color?: string }) => (
  <div className="relative w-6 h-6">
    <div
      className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full border-2"
      style={{ borderColor: color }}
    />
    <div
      className="absolute bottom-1 right-1 w-2 h-0.5 origin-bottom-right"
      style={{ backgroundColor: color, transform: 'rotate(45deg)' }}
    />
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

const BarcodeIcon = ({ color = '#4A90E2' }: { color?: string }) => (
  <div className="flex items-center justify-center gap-0.5 w-5 h-5">
    <div className="h-4" style={{ backgroundColor: color, width: '2px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '3px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '1px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '4px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '2px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '3px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '1px' }} />
    <div className="h-4" style={{ backgroundColor: color, width: '2px' }} />
  </div>
);

const InfoIcon = ({ color = '#999999' }: { color?: string }) => (
  <div
    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center"
  >
    <span className="text-xs font-bold" style={{ color }}>
      i
    </span>
  </div>
);

const CalendarIcon = ({ color = '#666666' }: { color?: string }) => (
  <div className="relative w-5 h-5">
    <div
      className="absolute bottom-0 left-0.5 w-4 h-3.5 border-2 rounded"
      style={{ borderColor: color }}
    />
    <div
      className="absolute top-0 left-0.5 w-4 h-1 rounded"
      style={{ backgroundColor: color }}
    />
    <div
      className="absolute top-1.5 left-1.5 w-0.5 h-0.5 rounded-full"
      style={{ backgroundColor: color }}
    />
    <div
      className="absolute top-1.5 right-1.5 w-0.5 h-0.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  </div>
);

// Calendar Date Picker Component
interface CalendarDatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onCancel: () => void;
  isDarkMode: boolean;
}

const CalendarDatePicker = ({ selectedDate, onDateSelect, onCancel, isDarkMode }: CalendarDatePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(selectedDate);

  useEffect(() => {
    setSelectedDay(selectedDate);
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDay(newDate);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = selectedDay.getDate() === day &&
        selectedDay.getMonth() === currentMonth.getMonth() &&
        selectedDay.getFullYear() === currentMonth.getFullYear();
      const isToday = new Date().getDate() === day &&
        new Date().getMonth() === currentMonth.getMonth() &&
        new Date().getFullYear() === currentMonth.getFullYear();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-purple-600 text-white'
              : isToday && !isSelected
              ? 'border-2 border-purple-600 text-purple-600'
              : isDarkMode
              ? 'text-white hover:bg-gray-700'
              : 'text-gray-800 hover:bg-gray-100'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <button
          onClick={() => navigateMonth('prev')}
          className={`w-9 h-9 flex items-center justify-center rounded-lg ${
            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
          } hover:opacity-80`}
        >
          ‹
        </button>
        <span className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          onClick={() => navigateMonth('next')}
          className={`w-9 h-9 flex items-center justify-center rounded-lg ${
            isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'
          } hover:opacity-80`}
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="aspect-square flex items-center justify-center">
            <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{day}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {renderCalendarDays()}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onDateSelect(selectedDay)}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default function PointOfSalePage() {
  const { isAuthenticated, user, token } = useAuth();
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [pinValidated, setPinValidated] = useState(false);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Cart and orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [orderCounter, setOrderCounter] = useState(1);
  const [showCart, setShowCart] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState<number | null>(null);
  const [keypadValue, setKeypadValue] = useState('');
  const [activeMode, setActiveMode] = useState<'qty' | 'price' | 'percent'>('qty');
  const [isAppendMode, setIsAppendMode] = useState(false);
  const [orderSelectorVisible, setOrderSelectorVisible] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Modal states
  const [posCustomerModalVisible, setPosCustomerModalVisible] = useState(false);
  const [generalNoteModalVisible, setGeneralNoteModalVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [barcodeScannerModalVisible, setBarcodeScannerModalVisible] = useState(false);

  // Scanner state
  const [scannerPages, setScannerPages] = useState<ScannerPage[]>([
    { id: '1', storeName: '', scannedItems: [] }
  ]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isProcessingBarcode, setIsProcessingBarcode] = useState(false);
  const hasScannerSyncedRef = useRef(false);

  // Customer and note states
  const [selectedCustomer, setSelectedCustomer] = useState<{ email: string } | null>({ email: 'poscustomer@gmail.com' });
  const [customerSearch, setCustomerSearch] = useState('');
  const [generalNoteDate, setGeneralNoteDate] = useState('');
  const [generalNotePromoter, setGeneralNotePromoter] = useState('');
  const [generalNoteText, setGeneralNoteText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Price cache
  const priceCache = useRef<Map<string, { price: number; gst: number; timestamp: number }>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch products from API when PIN is validated
  useEffect(() => {
    const fetchProducts = async () => {
      if (!pinValidated || !token || !user) {
        return;
      }

      const currentStoreName = user.pos_shop_name || 'Food Square - Bandra';

      // Check cache first
      if (
        globalProductsCache.loaded &&
        globalProductsCache.data.length > 0 &&
        globalProductsCache.storeName === currentStoreName
      ) {
        console.log('✅ Using cached products:', globalProductsCache.data.length);
        setProducts(globalProductsCache.data);
        return;
      }

      setProductsLoading(true);
      setProductsError(null);

      try {
        const storeName = user.pos_shop_name || 'Food Square - Bandra';
        const state = user.company || 'Maharashtra';

        const url = `${BACKEND_URL}/api/store-product/?skip=0&limit=100&store=${encodeURIComponent(storeName)}&state=${encodeURIComponent(state)}`;

        console.log('📡 Fetching products from:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 401) {
            throw new Error('Authentication failed. Please login again.');
          }
          throw new Error(`Failed to fetch products: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const productItems = data.items || [];
        console.log('✅ Received products:', productItems.length, 'of', data.total);

        // Map API response to Product interface
        const mappedProducts: Product[] = productItems.map((item: any) => ({
          ykey: item.ykey,
          article: item.product_name,
          price: item.price,
          rate: item.rate,
          weight: item.weight,
          gst: item.gst,
        }));

        // Fetch detailed pricing for each product
        const updatedProducts = await Promise.all(
          mappedProducts.map(async (product: Product) => {
            try {
              const requestBody = {
                article_name: product.article,
                store_name: storeName,
              };
              const lookupResponse = await fetch(`${BACKEND_URL}/api/article-codes/article-lookup`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(requestBody),
              });

              if (lookupResponse.ok) {
                const lookupData = await lookupResponse.json();
                return {
                  ...product,
                  price: lookupData.price || product.price || PRODUCT_PRICE,
                  gst: lookupData.gst || product.gst || 0,
                };
              } else {
                return product;
              }
            } catch (error) {
              console.error('Error fetching price for', product.article, ':', error);
              return product;
            }
          })
        );

        setProducts(updatedProducts);
        
        // Update global cache
        globalProductsCache = {
          loaded: true,
          data: updatedProducts,
          storeName: storeName,
        };

        console.log('✅ Products loaded and cached');
      } catch (error: any) {
        console.error('❌ Error fetching products:', error);
        setProductsError(error.message || 'Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [pinValidated, token, user]);
  const fetchProductDetails = async (articleName: string, storeName: string) => {
    const cacheKey = `${articleName}|${storeName}`;
    const cached = priceCache.current.get(cacheKey);
    const cacheValidDuration = 24 * 60 * 60 * 1000; // 24 hours

    if (cached && (Date.now() - cached.timestamp) < cacheValidDuration) {
      return { price: cached.price, gst: cached.gst };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/article-codes/article-lookup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          article_name: articleName,
          store_name: storeName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        priceCache.current.set(cacheKey, {
          price: data.price,
          gst: data.gst,
          timestamp: Date.now()
        });
        return data;
      } else {
        // If article not found or other error, return null instead of throwing
        // This allows the cart to use the initial price
        console.warn(`Could not fetch price for article '${articleName}' at store '${storeName}':`, response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Return null instead of throwing to allow cart to use initial price
      return null;
    }
  };

  // Fetch product from backend when barcode is scanned
  const fetchProductFromBackend = useCallback(
    async (barcode: string): Promise<ScannedItem | null> => {
      try {
        const apiUrl = `${BACKEND_URL}/api/article-codes/barcode-scan`;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const payload = {
          barcode: barcode,
          store_name: user?.pos_shop_name || 'Default Store',
        };

        console.log('🔍 Barcode API Request:', payload);

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload),
        });

        console.log('📡 Barcode API Response Status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Barcode API Error:', errorText);

          if (response.status === 404) {
            alert(`Product Not Found\n\nBarcode: ${barcode}\n\nThis product may not be in the system yet.`);
            return null;
          }

          throw new Error(`API Error: ${response.status} - ${errorText || response.statusText}`);
        }

        const data = await response.json();
        console.log('🔥 Barcode API Response:', data);

        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response format from server');
        }

        const pricePerKg = data.price || 0;
        const weight = data.weight || 1.0;
        const gst = data.gst || 0;
        const totalPrice = pricePerKg * weight * (1 + gst);

        console.log('💰 Price calculation:', { pricePerKg, weight, gst, totalPrice });

        const scannedItem: ScannedItem = {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          barcode: barcode,
          product: data.product || 'Unknown Product',
          price: totalPrice,
          pricePerKg: pricePerKg,
          weight: weight,
          gst: gst,
          article_code: data.article_code,
          weight_code: data.weight_code,
          barcode_format: data.barcode_format,
          store_name: data.store_name || user?.pos_shop_name,
          pricelist: data.pricelist,
          timestamp: new Date().toISOString(),
        };

        console.log('✅ Created scanned item:', scannedItem);
        return scannedItem;
      } catch (error) {
        console.error('❌ Error fetching product from backend:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
          alert('Network Error\n\nCould not connect to server. Please check your internet connection.');
        } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
          alert('Authentication Error\n\nPlease login again to continue scanning.');
        } else if (!errorMessage.includes('404')) {
          alert(`Scan Error\n\nBarcode: ${barcode}\n\nError: ${errorMessage}`);
        }

        return null;
      }
    },
    [token, user?.pos_shop_name]
  );

  // Handle barcode detected from scanner
  const handleBarcodeDetected = useCallback(async (barcodeData: string) => {
    if (isProcessingBarcode) {
      console.log('⏸️ Already processing a barcode');
      return;
    }

    if (!barcodeData || barcodeData.trim().length === 0) {
      console.log('Empty barcode - rejecting');
      return;
    }

    console.log('✅ Processing barcode:', barcodeData);
    setIsProcessingBarcode(true);

    try {
      const productItem = await fetchProductFromBackend(barcodeData);

      if (productItem) {
        setScannerPages((prevPages) => {
          const updatedPages = [...prevPages];
          const currentPage = updatedPages[currentPageIndex];

          if (currentPage) {
            updatedPages[currentPageIndex] = {
              ...currentPage,
              scannedItems: [productItem, ...currentPage.scannedItems],
            };
          }
          return updatedPages;
        });
      }
    } catch (error) {
      console.error('❌ Error processing barcode:', error);
    } finally {
      setIsProcessingBarcode(false);
    }
  }, [isProcessingBarcode, fetchProductFromBackend, currentPageIndex]);

  // Handle submit from scanner modal - add items to cart
  const handleScannerSubmit = useCallback(() => {
    const totalItems = scannerPages.reduce((sum, page) => sum + page.scannedItems.length, 0);

    if (totalItems === 0) {
      alert('No Items\n\nPlease scan at least one item before submitting.');
      return;
    }

    // Close modal first
    setBarcodeScannerModalVisible(false);

    // Process items and add to cart
    if (!hasScannerSyncedRef.current) {
      console.log('🛒 Processing scanned items for cart...');

      const itemsToAdd: Array<{ykey: string, productName: string, pricePerKg: number, weight: number, gst: number}> = [];

      scannerPages.forEach((page) => {
        if (page.scannedItems && page.scannedItems.length > 0) {
          page.scannedItems.forEach((scannedItem) => {
            const ykey = scannedItem.article_code?.toString() || scannedItem.barcode || scannedItem.id;
            const productName = scannedItem.product || 'Unknown Product';
            let weight = scannedItem.weight || 0;
            const weightCode = scannedItem.weight_code;

            // Convert grams to kg if needed
            if (weightCode === 'g' || weightCode === 'G' || (weight > 0 && weight < 0.1 && !weightCode)) {
              weight = weight / 1000;
            }

            const gst = scannedItem.gst || 0;
            let pricePerKg = scannedItem.pricePerKg || 0;

            if (!pricePerKg && scannedItem.price) {
              const totalPrice = scannedItem.price;
              if (weight <= 0) weight = 0.001;
              const denominator = weight * (1 + gst);
              pricePerKg = denominator > 0 ? totalPrice / denominator : totalPrice / weight;
            }

            if (weight <= 0) weight = 0.001;

            console.log('🛒 Adding to cart:', { ykey, productName, pricePerKg, weight, gst });
            itemsToAdd.push({ ykey, productName, pricePerKg, weight, gst });
          });
        }
      });

      // Ensure order exists
      let targetOrderId = currentOrderId;
      if (!targetOrderId) {
        targetOrderId = `order-${Date.now()}`;
        const newOrder: Order = {
          id: targetOrderId,
          orderNumber: orderCounter,
          items: [],
          createdAt: new Date(),
        };
        setOrders(prev => [...prev, newOrder]);
        setCurrentOrderId(targetOrderId);
        setOrderCounter(prev => prev + 1);
      }

      // Add items to cart
      const finalOrderId = targetOrderId;
      setTimeout(() => {
        setOrders((prevOrders) => {
          const order = prevOrders.find(o => o.id === finalOrderId);
          if (!order) return prevOrders;

          let currentCartItems = [...(order.items || [])];

          itemsToAdd.forEach((item) => {
            const existingItem = currentCartItems.find(cartItem => cartItem.ykey === item.ykey);

            if (existingItem) {
              currentCartItems = currentCartItems.map(cartItem =>
                cartItem.ykey === item.ykey
                  ? {
                      ...cartItem,
                      quantity: cartItem.quantity + item.weight,
                      price: cartItem.price + (item.weight * item.pricePerKg * (1 + item.gst))
                    }
                  : cartItem
              );
            } else {
              const itemTotalPrice = item.weight * item.pricePerKg * (1 + item.gst);
              currentCartItems.push({
                ykey: item.ykey,
                product: item.productName,
                quantity: item.weight,
                price: itemTotalPrice,
                unitPrice: item.pricePerKg,
                unit: 'Kg'
              });
            }
          });

          return prevOrders.map(o =>
            o.id === finalOrderId
              ? { ...o, items: currentCartItems }
              : o
          );
        });
      }, 100);

      hasScannerSyncedRef.current = true;

      // Reset scanner pages for next use
      setScannerPages([{ id: '1', storeName: user?.pos_shop_name || '', scannedItems: [] }]);
      setCurrentPageIndex(0);
    }
  }, [scannerPages, currentOrderId, orderCounter, user?.pos_shop_name]);

  // Handle opening barcode scanner
  const handleOpenScanner = () => {
    const defaultStoreName = user?.pos_shop_name || '';

    if (scannerPages.length === 0 || scannerPages[0].scannedItems.length === 0) {
      setScannerPages([{ id: '1', storeName: defaultStoreName, scannedItems: [] }]);
      setCurrentPageIndex(0);
    }

    hasScannerSyncedRef.current = false;
    setBarcodeScannerModalVisible(true);
  };

  // Remove scanned item from current page
  const handleRemoveScannedItem = (index: number) => {
    setScannerPages(prev => {
      const updatedPages = [...prev];
      const currentPage = updatedPages[currentPageIndex];
      if (currentPage) {
        currentPage.scannedItems = currentPage.scannedItems.filter((_, i) => i !== index);
      }
      return updatedPages;
    });
  };

  // Add new scanner page
  const handleAddScannerPage = () => {
    setScannerPages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        storeName: user?.pos_shop_name || '',
        scannedItems: []
      }
    ]);
    setCurrentPageIndex(scannerPages.length);
  };

  // Remove scanner page
  const handleRemoveScannerPage = () => {
    if (scannerPages.length > 1 && scannerPages[currentPageIndex]?.scannedItems.length === 0) {
      setScannerPages(prev => prev.filter((_, idx) => idx !== currentPageIndex));
      setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    }
  };

  const getCurrentOrder = () => {
    if (!currentOrderId) return null;
    return orders.find(order => order.id === currentOrderId);
  };

  const currentOrder = getCurrentOrder();
  const cartItems = currentOrder?.items || [];

  const filteredProducts = searchQuery.trim()
    ? products.filter(product =>
        product.article.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : products;

  const cartTotal = cartItems.reduce((sum, item) => {
    // Calculate price as quantity * unitPrice (or fall back to stored price)
    const basePrice = item.unitPrice ? (item.quantity * item.unitPrice) : (item.price || 0);
    const discountAmount = item.discount ? (basePrice * item.discount / 100) : 0;
    const discountedPrice = basePrice - discountAmount;
    return sum + discountedPrice;
  }, 0);

  const taxes = 0; // Can be calculated from GST if needed
  const grandTotal = cartTotal;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getProductCount = (ykey: string) => {
    const item = cartItems.find(item => item.ykey === ykey);
    return item ? item.quantity : 0;
  };

  const handleCreateNewOrder = () => {
    const newOrderId = `order-${Date.now()}`;
    const newOrder: Order = {
      id: newOrderId,
      orderNumber: orderCounter,
      items: [],
      createdAt: new Date(),
    };
    setOrders(prev => [...prev, newOrder]);
    setCurrentOrderId(newOrderId);
    setOrderCounter(prev => prev + 1);
    setSelectedCartItem(null);
    setKeypadValue('');
  };

  const updateCurrentOrderItems = (items: CartItem[]) => {
    if (!currentOrderId) return;
    setOrders(prev => prev.map(order =>
      order.id === currentOrderId
        ? { ...order, items }
        : order
    ));
  };

  const handleAddToCart = async (
    ykey: string,
    article: string,
    productPrice: number = PRODUCT_PRICE,
    weight: number = 1,
    gst: number = 0
  ) => {
    const basePrice = weight * productPrice;
    const gstAmount = basePrice * gst;
    const initialTotalPrice = basePrice + gstAmount;

    if (!currentOrderId) {
      const newOrderId = `order-${Date.now()}`;
      const newOrder: Order = {
        id: newOrderId,
        orderNumber: orderCounter,
        items: [{
          ykey,
          product: article,
          quantity: weight,
          price: initialTotalPrice,
          unitPrice: productPrice,
          unit: 'Kg'
        }],
        createdAt: new Date(),
      };
      setOrders(prev => [...prev, newOrder]);
      setCurrentOrderId(newOrderId);
      setOrderCounter(prev => prev + 1);

      // Fetch actual price in background
      const storeName = user?.pos_shop_name || '';
      fetchProductDetails(article, storeName)
        .then(productDetails => {
          // If product details not found, keep the initial price
          if (!productDetails) {
            console.log(`Using initial price for ${article}`);
            return;
          }
          
          const actualPrice = productDetails.price || productPrice;
          const actualGst = productDetails.gst || gst;
          const actualBasePrice = weight * actualPrice;
          const actualGstAmount = actualBasePrice * actualGst;
          const actualTotalPrice = actualBasePrice + actualGstAmount;

          setOrders(prev => prev.map(order =>
            order.id === newOrderId
              ? {
                  ...order,
                  items: order.items.map(item =>
                    item.ykey === ykey ? { ...item, price: actualTotalPrice, unitPrice: actualPrice } : item
                  )
                }
              : order
          ));
        })
        .catch(err => console.error('Background price fetch failed:', err));
      return;
    }

    const currentItems = cartItems;
    const existingItem = currentItems.find(item => item.ykey === ykey);
    const updatedItems = existingItem
      ? currentItems.map(item =>
          item.ykey === ykey
            ? {
                ...item,
                quantity: item.quantity + weight,
                price: item.price + initialTotalPrice,
                unitPrice: productPrice
              }
            : item
        )
      : [...currentItems, {
          ykey,
          product: article,
          quantity: weight,
          price: initialTotalPrice,
          unitPrice: productPrice,
          unit: 'Kg'
        }];

    updateCurrentOrderItems(updatedItems);

    // Fetch actual price in background
    const storeName = user?.pos_shop_name || '';
    fetchProductDetails(article, storeName)
      .then(productDetails => {
        // If product details not found, keep the initial unitPrice
        if (!productDetails) {
          console.log(`Using initial price for ${article}`);
          return;
        }
        
        const actualPrice = productDetails.price || productPrice;

        // Update unitPrice for the item
        if (currentOrderId) {
          setOrders(prev => prev.map(order =>
            order.id === currentOrderId
              ? {
                  ...order,
                  items: order.items.map(item =>
                    item.ykey === ykey ? { ...item, unitPrice: actualPrice } : item
                  )
                }
              : order
          ));
        }
      })
      .catch(err => console.error('Background price fetch failed:', err));
  };

  const handleCartClick = () => {
    if (cartItems.length > 0) {
      setShowCart(true);
    }
  };

  const handleBackToProducts = () => {
    setShowCart(false);
    setSelectedCartItem(null);
    setKeypadValue('');
  };

  const handleKeypadInput = (value: string) => {
    let newValue = '';
    if (value === 'delete') {
      newValue = keypadValue.slice(0, -1);
      if (newValue === '') {
        setIsAppendMode(false);
      } else {
        setIsAppendMode(true);
      }
    } else if (value === 'decimal') {
      if (!keypadValue.includes('.')) {
        newValue = isAppendMode ? keypadValue + '.' : '.';
        setIsAppendMode(true);
      } else {
        newValue = keypadValue;
      }
    } else if (value === 'negate') {
      newValue = keypadValue.startsWith('-') ? keypadValue.slice(1) : '-' + keypadValue;
      setIsAppendMode(false);
    } else {
      if (isAppendMode) {
        newValue = keypadValue + value;
      } else {
        newValue = value;
        setIsAppendMode(true);
      }
    }

    setKeypadValue(newValue);

    if (selectedCartItem !== null && currentOrderId) {
      if (newValue === '' || newValue === '-') {
        const newItems = [...cartItems];
        if (activeMode === 'percent') {
          newItems[selectedCartItem] = {
            ...newItems[selectedCartItem],
            discount: 0
          };
        }
        updateCurrentOrderItems(newItems);
      } else {
        const numValue = parseFloat(newValue);
        if (!isNaN(numValue) && numValue >= 0) {
          const newItems = [...cartItems];
          if (activeMode === 'qty') {
            newItems[selectedCartItem] = { ...newItems[selectedCartItem], quantity: numValue };
          } else if (activeMode === 'price') {
            newItems[selectedCartItem] = { ...newItems[selectedCartItem], price: numValue };
          } else if (activeMode === 'percent') {
            if (numValue >= 0 && numValue <= 100) {
              newItems[selectedCartItem] = {
                ...newItems[selectedCartItem],
                discount: numValue
              };
            }
          }
          updateCurrentOrderItems(newItems);
        }
      }
    }
  };

  const handleSelectCartItem = (index: number) => {
    setSelectedCartItem(index);
    setIsAppendMode(false);
    const item = cartItems[index];
    if (activeMode === 'qty') {
      setKeypadValue(item.quantity.toString());
    } else if (activeMode === 'price') {
      setKeypadValue(item.price.toString());
    } else if (activeMode === 'percent') {
      setKeypadValue(item.discount ? item.discount.toString() : '0');
    } else {
      setKeypadValue('');
    }
  };

  const handleRemoveCartItem = (index: number) => {
    if (currentOrderId) {
      const newItems = cartItems.filter((_, i) => i !== index);
      updateCurrentOrderItems(newItems);
      if (selectedCartItem === index) {
        setSelectedCartItem(null);
        setKeypadValue('');
      } else if (selectedCartItem !== null && selectedCartItem > index) {
        setSelectedCartItem(selectedCartItem - 1);
      }
    }
  };

  const handleSwitchOrder = (orderId: string) => {
    setCurrentOrderId(orderId);
    setOrderSelectorVisible(false);
    setSelectedCartItem(null);
    setKeypadValue('');
  };

  const handleConfirmPayment = async () => {
    // Validate required fields
    if (!generalNoteDate.trim() || !generalNotePromoter.trim()) {
      alert('Please fill in the Date and Promoter name in the General Note before confirming payment.');
      setGeneralNoteModalVisible(true);
      return;
    }

    if (cartItems.length === 0) {
      alert('Cart is empty. Please add items before confirming payment.');
      return;
    }

    const confirmMessage = `Total Amount: ₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\nDo you want to confirm this payment?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSubmittingPayment(true);

    try {
      // Prepare cart items for API
      const itemsPayload = cartItems.map(item => ({
        ykey: item.ykey,
        product: item.product,
        quantity: item.quantity,
        price: item.unitPrice ? (item.quantity * item.unitPrice) : item.price,
        unit: item.unit || 'Kg',
        discount: item.discount || 0,
      }));

      // Prepare barcode scanned pages data
      const barcodeScannedPages = scannerPages.map((page, index) => ({
        page_number: index + 1,
        store_name: page.storeName || user?.pos_shop_name || '',
        items_count: page.scannedItems.length,
        items: page.scannedItems.map(item => ({
          barcode: item.barcode,
          product: item.product,
          price: item.price,
          price_per_kg: item.pricePerKg,
          weight: item.weight,
          gst: item.gst,
          article_code: item.article_code,
          timestamp: item.timestamp,
        })),
      }));

      const totalBarcodeCount = scannerPages.reduce(
        (sum, page) => sum + page.scannedItems.length,
        0
      );

      // Construct payload matching React Native implementation
      const payload = {
        store_name: user?.pos_shop_name || '',
        customer_email: selectedCustomer?.email || 'poscustomer@gmail.com',
        items: itemsPayload,
        general_note: {
          date: generalNoteDate,
          promoter_name: generalNotePromoter,
          barcode_scanned_pages: barcodeScannedPages,
          total_barcode_count: totalBarcodeCount,
          note_text: generalNoteText || '',
        },
        total_amount: grandTotal,
        total_quantity: totalItems,
        taxes: taxes,
      };

      console.log('📤 Submitting POS entry:', payload);

      const response = await fetch(`${BACKEND_URL}/api/pos-entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 POS entry response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ POS entry error:', errorText);
        throw new Error(`Failed to submit: ${response.status} - ${errorText || response.statusText}`);
      }

      const responseData = await response.json();
      console.log('✅ POS entry response:', responseData);

      // Success - clear cart and reset state
      if (currentOrderId) {
        updateCurrentOrderItems([]);
      }

      // Reset scanner pages
      setScannerPages([{ id: '1', storeName: user?.pos_shop_name || '', scannedItems: [] }]);
      setCurrentPageIndex(0);
      hasScannerSyncedRef.current = false;

      // Reset general note fields
      setGeneralNoteDate('');
      setGeneralNotePromoter('');
      setGeneralNoteText('');

      alert(
        `Payment confirmed successfully!\n\n` +
        `Date: ${generalNoteDate}\n` +
        `POS Store Name: ${user?.pos_shop_name || 'N/A'}\n` +
        `Total Amount: ₹ ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
        `Total Kgs: ${totalItems.toFixed(3)}\n` +
        `Barcodes Scanned: ${totalBarcodeCount}`
      );

      setShowCart(false);
    } catch (error) {
      console.error('❌ Payment submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
        alert('Network Error\n\nCould not connect to server. Please check your internet connection and try again.');
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        alert('Authentication Error\n\nYour session may have expired. Please login again.');
      } else {
        alert(`Payment Failed\n\n${errorMessage}\n\nPlease try again.`);
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  const handleBack = () => {
    router.push('/dashboard');
  };

  const handleProfile = () => {
    setSidebarVisible(false);
    router.push('/profile');
  };

  const handleLogout = () => {
    router.push('/login');
  };

  const handleContinueSelling = () => {
    setPinValidated(true);
  };

  // Initial screen (before continuing selling)
  if (!pinValidated) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onProfileClick={handleProfile}
          onLogout={handleLogout}
          onHomeClick={handleBack}
        />

        {/* Top Red Bar */}
        <div className="h-1 bg-red-900" />

        {/* Main Header */}
        <header
          className={`flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 h-12 sm:h-14 ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <button onClick={handleBack} className="hover:opacity-70 transition-opacity">
              <HamburgerIcon color={isDarkMode ? '#FFFFFF' : '#000000'} />
            </button>
            <h1 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Point of Sale
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ChatIconProfile notificationCount={2} />
            <ClockIconProfile color={isDarkMode ? '#CCCCCC' : '#666666'} />
            <button onClick={() => setSidebarVisible(true)} className="hover:opacity-70 transition-opacity">
              <SquareIconProfile size="small" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 p-3 sm:p-4 md:p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
          {/* Store Header */}
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h2 className={`text-sm sm:text-base font-medium flex-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {user.pos_shop_name || 'Store'}
            </h2>
            <button className="hover:opacity-70 transition-opacity">
              <EllipsisIcon color={isDarkMode ? '#CCCCCC' : '#666666'} />
            </button>
          </div>

          {/* User Name Section */}
          <div className="mb-4 sm:mb-6">
            <h3 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {user.users || user.company || 'User'}
            </h3>
          </div>

          {/* Action Section */}
          <div className="mb-4 sm:mb-6">
            <button
              onClick={handleContinueSelling}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-lg transition-colors shadow-md text-sm sm:text-base"
            >
              Continue Selling
            </button>
          </div>

          {/* Bottom Icon */}
          <div className="fixed bottom-4 right-4">
            <SquareIconProfile size="small" />
          </div>
        </main>
      </div>
    );
  }

  // Cart screen (when showCart is true)
  if (pinValidated && showCart) {
    return (
      <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onProfileClick={handleProfile}
          onLogout={handleLogout}
          onHomeClick={handleBack}
        />

        {/* Top Red Bar */}
        <div className="h-1 bg-red-900 shrink-0" />

        {/* Cart Top Bar */}
        <header className={`flex items-center px-2 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-3 min-h-10 sm:min-h-12 shrink-0 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
          <button
            onClick={handleCreateNewOrder}
            className="w-7 h-7 sm:w-9 sm:h-9 bg-white rounded flex items-center justify-center hover:opacity-80"
          >
            <PlusIcon color="#4A90E2" />
          </button>
          <button
            onClick={() => setOrderSelectorVisible(true)}
            className="w-7 h-7 sm:w-9 sm:h-9 bg-white rounded flex items-center justify-center hover:opacity-80"
          >
            <DownArrowIcon color="#4A90E2" />
          </button>
          <div className="flex-1" />
          <button onClick={handleOpenScanner} className="hover:opacity-70">
            <BarcodeIcon color="#4A90E2" />
          </button>
          <button onClick={() => setSidebarVisible(true)} className="hover:opacity-70">
            <SquareIconProfile size="small" />
          </button>
        </header>

        {/* Cart Items List - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-white min-h-0">{cartItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-200 ${
                selectedCartItem === index ? 'bg-cyan-50' : 'bg-white'
              }`}
            >
              <button
                onClick={() => handleSelectCartItem(index)}
                className="flex-1 flex items-center justify-between hover:opacity-80"
              >
                <div className="flex-1 mr-2 sm:mr-4">
                  <p className="text-sm sm:text-base font-medium text-black mb-0.5 sm:mb-1">{item.product}</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Weight: {item.quantity.toFixed(3)} {item.unit}
                    {item.discount && item.discount > 0 && (
                      <span className="text-blue-600 font-medium"> ({item.discount}% off)</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm sm:text-base font-semibold text-black">
                    ₹ {(() => {
                      // Calculate price as quantity * unitPrice (or fall back to stored price)
                      const basePrice = item.unitPrice ? (item.quantity * item.unitPrice) : (item.price || 0);
                      const discountAmount = item.discount ? (basePrice * item.discount / 100) : 0;
                      const discountedPrice = basePrice - discountAmount;
                      return discountedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </p>
                  {item.discount && item.discount > 0 && (
                    <p className="text-xs text-gray-400 line-through">
                      ₹ {(() => {
                        const basePrice = item.unitPrice ? (item.quantity * item.unitPrice) : (item.price || 0);
                        return basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </p>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleRemoveCartItem(index)}
                className="ml-3 p-1 hover:opacity-70 min-w-8 text-center"
              >
                <span className="text-3xl text-red-500 font-light leading-none">×</span>
              </button>
            </div>
          ))}
        </div>

        {/* Transaction Summary - Fixed */}
        <div className="px-2 sm:px-4 py-2 sm:py-3 bg-white border-t border-gray-200 shrink-0">
          <div className="flex justify-between items-center mb-1 sm:mb-2">
            <span className="text-sm sm:text-base text-gray-600">Taxes</span>
            <span className="text-sm sm:text-base text-gray-600">₹ {taxes.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-base sm:text-lg font-bold text-black">Total</span>
            <span className="text-base sm:text-lg font-bold text-black">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Keypad - Fixed */}
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 border-t border-gray-200 shrink-0">
          {selectedCartItem !== null ? (
            <div className="bg-white rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 mb-1.5 sm:mb-2 border-2 border-blue-500 flex justify-between items-center">
              <span className="text-xs sm:text-sm font-semibold text-gray-600">
                {activeMode === 'qty' ? 'Quantity' : activeMode === 'price' ? 'Price' : 'Discount'}:
              </span>
              <span className="text-base sm:text-xl font-bold text-black">
                {keypadValue || '0'}
                {activeMode === 'percent' && '%'}
                {activeMode === 'price' && ' ₹'}
                {activeMode === 'qty' && ' Kg'}
              </span>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-lg px-3 py-2 mb-2 border border-yellow-300">
              <p className="text-xs text-yellow-800 text-center">Select an item to edit quantity, price, or discount</p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* Row 1 */}
            {[1, 2, 3].map(num => (
              <button
                key={num}
                onClick={() => handleKeypadInput(num.toString())}
                className="aspect-[1.6] bg-gray-200 rounded flex items-center justify-center text-sm sm:text-base font-semibold text-gray-800 hover:bg-gray-300"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveMode('qty');
                setIsAppendMode(false);
                if (selectedCartItem !== null) {
                  setKeypadValue(cartItems[selectedCartItem].quantity.toString());
                }
              }}
              className={`aspect-[1.6] rounded flex items-center justify-center text-xs sm:text-sm font-semibold ${
                activeMode === 'qty' ? 'bg-teal-200 text-gray-800' : 'bg-gray-200 text-gray-800'
              } hover:opacity-80`}
            >
              Qty
            </button>

            {/* Row 2 */}
            {[4, 5, 6].map(num => (
              <button
                key={num}
                onClick={() => handleKeypadInput(num.toString())}
                className="aspect-[1.6] bg-gray-200 rounded flex items-center justify-center text-base font-semibold text-gray-800 hover:bg-gray-300"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveMode('percent');
                setIsAppendMode(false);
                if (selectedCartItem !== null) {
                  const item = cartItems[selectedCartItem];
                  setKeypadValue(item.discount ? item.discount.toString() : '0');
                }
              }}
              className={`aspect-[1.6] rounded flex items-center justify-center text-sm font-semibold ${
                activeMode === 'percent' ? 'bg-teal-200 text-gray-800' : 'bg-gray-200 text-gray-800'
              } hover:opacity-80`}
            >
              %
            </button>

            {/* Row 3 */}
            {[7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handleKeypadInput(num.toString())}
                className="aspect-[1.6] bg-gray-200 rounded flex items-center justify-center text-base font-semibold text-gray-800 hover:bg-gray-300"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => {
                setActiveMode('price');
                setIsAppendMode(false);
                if (selectedCartItem !== null) {
                  setKeypadValue(cartItems[selectedCartItem].price.toString());
                }
              }}
              className={`aspect-[1.6] rounded flex items-center justify-center text-sm font-semibold ${
                activeMode === 'price' ? 'bg-teal-200 text-gray-800' : 'bg-gray-200 text-gray-800'
              } hover:opacity-80`}
            >
              Price
            </button>

            {/* Row 4 */}
            <button
              onClick={() => handleKeypadInput('negate')}
              className="aspect-[1.6] bg-gray-200 rounded flex items-center justify-center text-base font-semibold text-gray-800 hover:bg-gray-300"
            >
              +/-
            </button>
            <button
              onClick={() => handleKeypadInput('0')}
              className="aspect-[1.6] bg-gray-200 rounded flex items-center justify-center text-base font-semibold text-gray-800 hover:bg-gray-300"
            >
              0
            </button>
            <button
              onClick={() => handleKeypadInput('decimal')}
              className="aspect-[1.6] bg-gray-200 rounded flex items-center justify-center text-base font-semibold text-gray-800 hover:bg-gray-300"
            >
              .
            </button>
            <button
              onClick={() => handleKeypadInput('delete')}
              className="aspect-[1.6] bg-red-500 rounded flex items-center justify-center hover:bg-red-600"
            >
              <CrossIcon color="#FFFFFF" />
            </button>
          </div>
        </div>

        {/* Action Buttons - Fixed */}
        <div className="flex px-2 sm:px-4 py-1.5 sm:py-2 gap-2 sm:gap-3 bg-gray-100 border-t border-gray-200 shrink-0">
          <button
            onClick={() => setPosCustomerModalVisible(true)}
            className="flex-1 bg-gray-200 rounded-lg py-2 sm:py-3 text-sm sm:text-base font-semibold text-blue-600 hover:bg-gray-300"
          >
            POS Customer
          </button>
          <button
            onClick={() => setGeneralNoteModalVisible(true)}
            className="flex-1 bg-gray-200 rounded-lg py-2 sm:py-3 text-sm sm:text-base font-semibold text-black hover:bg-gray-300"
          >
            Actions
          </button>
        </div>

        {/* Bottom Navigation - Fixed */}
        <div className="flex items-center px-2 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-3 bg-gray-100 border-t border-gray-200 shrink-0">
          <button
            onClick={handleBackToProducts}
            disabled={isSubmittingPayment}
            className="w-10 h-10 sm:w-14 sm:h-13 bg-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
          >
            <span className="text-xl sm:text-2xl font-semibold text-gray-800">&lt;</span>
          </button>
          <button
            onClick={handleConfirmPayment}
            disabled={isSubmittingPayment}
            className="flex-1 bg-purple-600 rounded-lg py-2.5 sm:py-3.5 text-base sm:text-lg font-bold text-white hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmittingPayment ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>

        {/* Order Selector Modal */}
        {orderSelectorVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
            <div className="bg-white rounded-t-3xl w-full max-h-[60%] overflow-auto pb-5">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <button onClick={() => setOrderSelectorVisible(false)} className="text-2xl font-semibold text-gray-800">
                  &lt;
                </button>
                <h2 className="text-lg font-semibold text-black">Choose an order</h2>
                <div className="w-6" />
              </div>
              <div className="p-4 space-y-3">
                {orders.sort((a, b) => b.orderNumber - a.orderNumber).map(order => (
                  <button
                    key={order.id}
                    onClick={() => handleSwitchOrder(order.id)}
                    className={`w-full p-4 border-2 rounded-lg text-lg font-semibold text-center ${
                      currentOrderId === order.id
                        ? 'border-teal-200 bg-cyan-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-800'
                    } hover:opacity-80`}
                  >
                    {order.orderNumber}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POS Customer Modal */}
        {posCustomerModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
            <div className="bg-white rounded-t-3xl w-full max-w-2xl mx-auto max-h-[80%] flex flex-col pb-3 sm:pb-5">
              <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 shrink-0">
                <h2 className="text-base sm:text-lg font-semibold text-black">POS Customer</h2>
                <button
                  onClick={() => setPosCustomerModalVisible(false)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <SearchIcon color="#666666" />
                </button>
              </div>

              {selectedCustomer && (
                <div className="flex justify-between items-center p-4 border-b border-gray-200 shrink-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base text-gray-600">✉</span>
                      <span className="text-sm text-gray-800">{selectedCustomer.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCustomer(null)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      <span className="text-xs font-semibold text-gray-800">UNSELECT</span>
                      <span className="text-base text-gray-600 font-bold">×</span>
                    </button>
                    <button className="text-gray-600 hover:text-gray-800">
                      <HamburgerIcon color="#666666" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 sm:p-4 border-b border-gray-200 shrink-0">
                <input
                  type="text"
                  className="w-full bg-gray-100 rounded-lg px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm text-gray-800"
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                <button
                  onClick={() => {
                    setSelectedCustomer({ email: 'poscustomer@gmail.com' });
                    setCustomerSearch('');
                  }}
                  className="w-full p-3 border-b border-gray-100 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-800">poscustomer@gmail.com</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer({ email: 'customer2@example.com' });
                    setCustomerSearch('');
                  }}
                  className="w-full p-3 border-b border-gray-100 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-800">customer2@example.com</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedCustomer({ email: 'customer3@example.com' });
                    setCustomerSearch('');
                  }}
                  className="w-full p-3 border-b border-gray-100 text-left hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-800">customer3@example.com</span>
                </button>
              </div>

              <div className="px-4 shrink-0">
                <button
                  onClick={() => setPosCustomerModalVisible(false)}
                  className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* General Note Modal */}
        {generalNoteModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
            <div className="bg-white rounded-t-3xl w-full max-w-2xl mx-auto h-[90%] flex flex-col">
              <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 shrink-0">
                <button
                  onClick={() => setGeneralNoteModalVisible(false)}
                  className="text-2xl font-semibold text-gray-800"
                >
                  &lt;
                </button>
                <h2 className="text-lg font-semibold text-black">Add General Note</h2>
                <div className="w-6" />
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
                <div className="space-y-3 sm:space-y-5">
                  {/* Date Field */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-800 mb-1.5 sm:mb-2">
                      Date (DD-MM-YYYY) *
                    </label>
                    <button
                      onClick={() => setDatePickerVisible(true)}
                      className="w-full flex items-center justify-between border-1.5 border-gray-400 rounded-lg px-2 sm:px-3 py-2 sm:py-3 bg-white hover:bg-gray-50"
                    >
                      <input
                        type="text"
                        className="flex-1 text-xs sm:text-sm text-gray-800 bg-transparent pointer-events-none"
                        placeholder="dd-mm-yyyy"
                        value={generalNoteDate}
                        readOnly
                      />
                      <CalendarIcon color="#666666" />
                    </button>
                  </div>

                  {/* Promoter Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Promoter name *
                    </label>
                    <input
                      type="text"
                      className="w-full border-1.5 border-gray-400 rounded-lg px-3 py-3 text-sm text-gray-800 bg-white"
                      placeholder=""
                      value={generalNotePromoter}
                      onChange={(e) => setGeneralNotePromoter(e.target.value)}
                    />
                  </div>

                  {/* Barcode Scanned Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">
                      Barcode Scanned Count -
                    </label>
                    <div className="border-1.5 border-gray-400 rounded-lg px-3 py-3 bg-gray-50 min-h-15">
                      {scannerPages.map((page, index) => {
                        const itemCount = page.scannedItems.length;
                        if (itemCount === 0) return null;
                        return (
                          <div key={page.id} className="py-1.5 border-b border-gray-200 last:border-b-0">
                            <span className="text-sm text-gray-800">
                              Page {index + 1}: {itemCount} barcode{itemCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })}
                      {scannerPages.some(page => page.scannedItems.length > 0) && (
                        <div className="py-2 mt-1 border-t-2 border-blue-600">
                          <span className="text-sm font-semibold text-blue-600">
                            Total: {scannerPages.reduce((sum, page) => sum + page.scannedItems.length, 0)} barcode{scannerPages.reduce((sum, page) => sum + page.scannedItems.length, 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {!scannerPages.some(page => page.scannedItems.length > 0) && (
                        <span className="text-sm text-gray-400 italic">No barcodes scanned yet</span>
                      )}
                    </div>
                  </div>

                  {/* Note Text Area */}
                  <div>
                    <textarea
                      className="w-full border-1.5 border-gray-400 rounded-lg px-3 py-3 text-sm text-gray-800 bg-gray-100 min-h-37.5"
                      placeholder="Note field is read-only"
                      value={generalNoteText}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 px-4 py-4 bg-white border-t border-gray-200 shrink-0">
                <button
                  onClick={() => {
                    setGeneralNoteModalVisible(false);
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-3xl font-semibold hover:bg-gray-300"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setGeneralNoteModalVisible(false);
                    setGeneralNoteDate('');
                    setGeneralNotePromoter('');
                    setGeneralNoteText('');
                  }}
                  className="flex-1 py-3 bg-red-400 text-white rounded-3xl font-semibold hover:bg-red-500"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Date Picker Modal */}
        {datePickerVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 w-11/12 max-w-md`}>
              <h3 className={`text-lg font-semibold mb-4 text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Select Date
              </h3>
              <CalendarDatePicker
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const year = date.getFullYear();
                  setGeneralNoteDate(`${day}-${month}-${year}`);
                  setDatePickerVisible(false);
                }}
                onCancel={() => setDatePickerVisible(false)}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* Barcode Scanner Modal */}
        {barcodeScannerModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-4 py-3 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-semibold text-white">Barcode Scanner</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleScannerSubmit}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors"
                >
                  Submit ({scannerPages.reduce((sum, page) => sum + page.scannedItems.length, 0)})
                </button>
                <button
                  onClick={() => setBarcodeScannerModalVisible(false)}
                  className="text-white hover:opacity-70"
                >
                  <CrossIcon color="#FFFFFF" />
                </button>
              </div>
            </div>

            {/* Page Selector */}
            <div className="bg-gray-900 py-3 border-b border-gray-700 shrink-0">
              <div className="flex gap-2 px-4 overflow-x-auto">
                {scannerPages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPageIndex(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      index === currentPageIndex
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Page {index + 1}
                    {page.scannedItems.length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center">
                        {page.scannedItems.length}
                      </span>
                    )}
                  </button>
                ))}
                <button
                  onClick={handleAddScannerPage}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  + Add Page
                </button>
              </div>
              {scannerPages.length > 1 && scannerPages[currentPageIndex]?.scannedItems.length === 0 && (
                <div className="px-4 mt-2">
                  <button
                    onClick={handleRemoveScannerPage}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Remove this page
                  </button>
                </div>
              )}
            </div>

            {/* Scanner View */}
            <div className="flex-1 min-h-0 relative bg-black">
              {isProcessingBarcode && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <p className="text-white text-sm">Processing barcode...</p>
                  </div>
                </div>
              )}
              <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
            </div>

            {/* Bottom Sheet with Scanned Items */}
            <div className="bg-white rounded-t-3xl max-h-[35%] flex flex-col shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto my-2" />
              <div className="px-4 pb-2 border-b border-gray-200">
                <h3 className="text-base font-semibold text-black">
                  {scannerPages[currentPageIndex]?.storeName || user?.pos_shop_name || 'Store'}
                </h3>
                <p className="text-sm text-gray-600">
                  Scanned: {scannerPages[currentPageIndex]?.scannedItems.length || 0} items
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {scannerPages[currentPageIndex]?.scannedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <p className="text-base font-medium text-gray-600">No items scanned yet</p>
                    <p className="text-sm text-gray-400">Scan a barcode to begin</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scannerPages[currentPageIndex]?.scannedItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-gray-100 rounded-lg p-3 border-l-4 border-purple-600"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-purple-600">#{idx + 1}</span>
                          <button
                            onClick={() => handleRemoveScannedItem(idx)}
                            className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
                          >
                            <span className="text-white text-sm font-bold">×</span>
                          </button>
                        </div>
                        <p className="text-sm font-medium text-black mb-1">{item.product}</p>
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span>Price: ₹{item.price?.toFixed(2) || '0.00'}</span>
                          <span>Weight: {item.weight || '0'}kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Products screen (after clicking Continue Selling)
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onProfileClick={handleProfile}
        onLogout={handleLogout}
        onHomeClick={handleBack}
      />

      {/* Top Red Bar */}
      <div className="h-1 bg-red-900" />

      {/* Product Top Bar */}
      <header
        className={`flex items-center px-2 sm:px-4 md:px-6 py-2 sm:py-3 gap-2 sm:gap-3 min-h-10 sm:min-h-12 ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-200'
        }`}
      >
        <button
          onClick={handleCreateNewOrder}
          className="w-7 h-7 sm:w-9 sm:h-9 min-w-6 min-h-6 sm:min-w-8 sm:min-h-8 bg-white rounded flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          <PlusIcon color="#4A90E2" />
        </button>

        <button className="w-7 h-7 sm:w-9 sm:h-9 min-w-6 min-h-6 sm:min-w-8 sm:min-h-8 bg-white rounded flex items-center justify-center hover:opacity-80 transition-opacity">
          <DownArrowIcon color="#4A90E2" />
        </button>

        {isSearchActive ? (
          <>
            <div className="flex-1 flex items-center gap-1 sm:gap-2 mr-1 sm:mr-2 min-w-24 sm:min-w-37.5">
              <input
                type="text"
                className={`flex-1 h-7 sm:h-9 rounded-lg px-2 sm:px-3 text-xs sm:text-sm border ${
                  isDarkMode
                    ? 'bg-gray-800 text-white border-gray-600'
                    : 'bg-white text-black border-gray-300'
                } min-w-20 sm:min-w-30`}
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchActive(false);
                }}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <CrossIcon color={isDarkMode ? '#FFFFFF' : '#666666'} />
              </button>
            </div>
            <button onClick={handleOpenScanner} className="hover:opacity-70 transition-opacity">
              <BarcodeIcon color="#4A90E2" />
            </button>
            <button
              onClick={() => setSidebarVisible(true)}
              className="hover:opacity-70 transition-opacity"
            >
              <SquareIconProfile size="small" />
            </button>
          </>
        ) : (
          <>
            <div className="flex-1" />
            <button
              onClick={() => setIsSearchActive(true)}
              className="hover:opacity-70 transition-opacity"
            >
              <SearchIcon color="#4A90E2" />
            </button>
            <button onClick={handleOpenScanner} className="hover:opacity-70 transition-opacity">
              <BarcodeIcon color="#4A90E2" />
            </button>
            <button
              onClick={() => setSidebarVisible(true)}
              className="hover:opacity-70 transition-opacity"
            >
              <SquareIconProfile size="small" />
            </button>
          </>
        )}
      </header>

      {/* Category Container */}
      <div className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 flex items-center justify-center">
        <button className="bg-blue-200 text-blue-900 px-3 sm:px-6 py-2 sm:py-3 rounded-lg min-w-32 sm:min-w-50 text-center text-xs sm:text-sm font-medium hover:bg-blue-300 transition-colors">
          Smart, Essentials & Magson
        </button>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-auto pb-20 sm:pb-24">
        <div className="p-2 sm:p-4 md:p-6">
          {productsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
              <p className={`text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Loading products...
              </p>
            </div>
          ) : productsError ? (
            <div className="flex flex-col items-center justify-center py-16 px-5">
              <p className={`text-base font-medium text-center mb-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {productsError}
              </p>
              <button
                onClick={() => setPinValidated(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Go Back
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className={`text-base font-medium text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {searchQuery.trim()
                  ? `No products found for "${searchQuery}"`
                  : 'No products available for this store'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {filteredProducts.map((product) => {
                const count = getProductCount(product.ykey);
                const productPrice = product.price || product.rate || PRODUCT_PRICE;
                const productWeight = product.weight || 1;
                const productGst = product.gst || 0;
                return (
                  <button
                    key={product.ykey}
                    onClick={() => handleAddToCart(product.ykey, product.article, productPrice, productWeight, productGst)}
                    className="bg-blue-200 rounded-lg p-2 sm:p-3 md:p-4 min-h-20 sm:min-h-25 flex flex-col items-center justify-center relative hover:bg-blue-300 transition-colors"
                  >
                    <InfoIcon color="#999999" />
                    <p className="text-blue-900 text-[10px] sm:text-xs font-medium text-center leading-3 sm:leading-4">
                      {product.article}
                    </p>
                    {count > 0 && (
                      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white text-[10px] sm:text-xs font-bold">{count}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
        className={`fixed bottom-0 left-0 right-0 flex h-16 sm:h-20 border-t px-2 sm:px-4 py-2 sm:py-3 gap-2 sm:gap-3 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
        }`}
      >
        <button className="flex-1 bg-gray-200 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center hover:bg-gray-300 transition-colors">
          <span className="text-blue-900 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Pay</span>
          <span className="text-blue-900 text-xs sm:text-sm font-medium">₹ {cartTotal.toFixed(2)}</span>
        </button>
        <button
          onClick={handleCartClick}
          className="flex-1 bg-gray-200 rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center hover:bg-gray-300 transition-colors"
        >
          <span className="text-blue-900 text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">Cart</span>
          <span className="text-blue-900 text-xs sm:text-sm font-medium">{totalItems.toFixed(3)} kg</span>
        </button>
      </div>

      {/* Barcode Scanner Modal */}
      {barcodeScannerModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 px-2 sm:px-4 py-2 sm:py-3 flex justify-between items-center shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-white">Barcode Scanner</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleScannerSubmit}
                className="bg-purple-600 hover:bg-purple-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-semibold transition-colors"
              >
                Submit ({scannerPages.reduce((sum, page) => sum + page.scannedItems.length, 0)})
              </button>
              <button
                onClick={() => setBarcodeScannerModalVisible(false)}
                className="text-white hover:opacity-70"
              >
                <CrossIcon color="#FFFFFF" />
              </button>
            </div>
          </div>

          {/* Page Selector */}
          <div className="bg-gray-900 py-2 sm:py-3 border-b border-gray-700 shrink-0">
            <div className="flex gap-1.5 sm:gap-2 px-2 sm:px-4 overflow-x-auto">
              {scannerPages.map((page, index) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIndex(index)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                    index === currentPageIndex
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Page {index + 1}
                  {page.scannedItems.length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-5 text-center">
                      {page.scannedItems.length}
                    </span>
                  )}
                </button>
              ))}
              <button
                onClick={handleAddScannerPage}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                + Add Page
              </button>
            </div>
            {scannerPages.length > 1 && scannerPages[currentPageIndex]?.scannedItems.length === 0 && (
              <div className="px-4 mt-2">
                <button
                  onClick={handleRemoveScannerPage}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove this page
                </button>
              </div>
            )}
          </div>

          {/* Scanner View */}
          <div className="flex-1 min-h-0 relative bg-black">
            {isProcessingBarcode && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  <p className="text-white text-sm">Processing barcode...</p>
                </div>
              </div>
            )}
            <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
          </div>

          {/* Bottom Sheet with Scanned Items */}
          <div className="bg-white rounded-t-3xl max-h-[35%] flex flex-col shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto my-2" />
            <div className="px-4 pb-2 border-b border-gray-200">
              <h3 className="text-base font-semibold text-black">
                {scannerPages[currentPageIndex]?.storeName || user?.pos_shop_name || 'Store'}
              </h3>
              <p className="text-sm text-gray-600">
                Scanned: {scannerPages[currentPageIndex]?.scannedItems.length || 0} items
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {scannerPages[currentPageIndex]?.scannedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-base font-medium text-gray-600">No items scanned yet</p>
                  <p className="text-sm text-gray-400">Scan a barcode to begin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {scannerPages[currentPageIndex]?.scannedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-gray-100 rounded-lg p-3 border-l-4 border-purple-600"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-purple-600">#{idx + 1}</span>
                        <button
                          onClick={() => handleRemoveScannedItem(idx)}
                          className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600"
                        >
                          <span className="text-white text-sm font-bold">×</span>
                        </button>
                      </div>
                      <p className="text-sm font-medium text-black mb-1">{item.product}</p>
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>Price: ₹{item.price?.toFixed(2) || '0.00'}</span>
                        <span>Weight: {item.weight || '0'}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
