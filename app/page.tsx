'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import BarcodeScanner from '@/components/barcode-scanner'
import ScanResults from '@/components/scan-results'

export default function Page() {
  const [scannedCodes, setScannedCodes] = useState<string[]>([])
  const { isAuthenticated, logout, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  const handleBarcodeDetected = (code: string) => {
    setScannedCodes(prev => [code, ...prev.slice(0, 9)])
  }

  const clearResults = () => {
    setScannedCodes([])
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <main className="w-full min-h-screen flex flex-col items-center justify-center bg-background gap-4 sm:gap-6 p-4 sm:p-6">
      <div className="w-full max-w-4xl flex flex-col gap-4 sm:gap-6">
        {/* Header with Logout */}
        <div className="text-center space-y-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1"></div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground flex-1">
              Barcode Scanner
            </h1>
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Point your camera at a barcode to scan it. The ROI box in the center helps with positioning.
          </p>
          {user && (
            <p className="text-xs text-muted-foreground">
              Logged in as: {user.email}
            </p>
          )}
        </div>

        {/* Scanner */}
        <div className="w-full">
          <BarcodeScanner onBarcodeDetected={handleBarcodeDetected} />
        </div>

        {/* Results */}
        {scannedCodes.length > 0 && (
          <ScanResults codes={scannedCodes} onClear={clearResults} />
        )}
      </div>
    </main>
  )
}
