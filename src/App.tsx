import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Customer Pages
import HomePage from './pages/customer/HomePage'
import ProductPage from './pages/customer/ProductPage'
import CartPage from './pages/customer/CartPage'
import OrderCompletePage from './pages/customer/OrderCompletePage'
import GiftProductDetailPage from './pages/customer/GiftProductDetailPage'

// Admin Pages
import LoginPage from './pages/admin/LoginPage'
import DashboardPage from './pages/admin/DashboardPage'
import ProductManagePage from './pages/admin/ProductManagePage'
import OrderManagePage from './pages/admin/OrderManagePage'

// Components
import { ProtectedRoute } from './components/admin'
import { ErrorBoundary, ToastContainer } from './components/common'

import { ROUTES } from './utils/constants'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        console.log(`🔄 Query 재시도 (${failureCount}/3):`, error?.message)
        // 네트워크 에러는 3번, 기타 에러는 1번만 재시도
        if (error?.message?.includes('Network') || error?.message?.includes('fetch')) {
          return failureCount < 3
        }
        return failureCount < 1
      },
      retryDelay: (attemptIndex) => {
        // 지수적 지연: 1s, 2s, 4s
        return Math.min(1000 * (2 ** attemptIndex), 10000)
      },
      staleTime: 30 * 1000, // 30초
      gcTime: 5 * 60 * 1000, // 5분 동안 캐시 유지
      refetchOnWindowFocus: true, // 창 포커스 시 자동 refetch
      refetchOnReconnect: true, // 네트워크 재연결 시 refetch
      networkMode: 'online', // 온라인일 때만 쿼리 실행
    },
    mutations: {
      retry: false, // 뮤테이션은 재시도하지 않음
      networkMode: 'online',
    }
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Customer Routes */}
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.PRODUCTS} element={<ProductPage />} />
              <Route path={ROUTES.CART} element={<CartPage />} />
              <Route path={ROUTES.ORDER_COMPLETE} element={<OrderCompletePage />} />
              <Route path="/gift-product/:productId" element={<GiftProductDetailPage />} />
              
              {/* Admin Routes */}
              <Route path={ROUTES.ADMIN_LOGIN} element={<LoginPage />} />
              <Route 
                path={ROUTES.ADMIN_DASHBOARD} 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={ROUTES.ADMIN_PRODUCTS} 
                element={
                  <ProtectedRoute>
                    <ProductManagePage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={ROUTES.ADMIN_ORDERS} 
                element={
                  <ProtectedRoute>
                    <OrderManagePage />
                  </ProtectedRoute>
                } 
              />
            </Routes>

            {/* 전역 토스트 컨테이너 */}
            <ToastContainer />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App