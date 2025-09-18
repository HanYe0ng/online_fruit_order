import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/products'
import { ProductFormData, ProductFilters } from '../types/product'
import { PostgrestError } from '@supabase/supabase-js'

// 인증 오류 감지 (Supabase v2 기준: status 코드 활용 권장)
const isAuthError = (error: any): boolean => {
  if (!error) return false
  
  if (error instanceof PostgrestError) {
    return error.code === 'PGRST301' || error.code === 'PGRST302'
  }
  
  const msg = error.message || error.toString()
  return (
    msg.includes('JWT expired') ||
    msg.includes('Invalid JWT') ||
    msg.includes('Authentication required') ||
    msg.includes('Session not found') ||
    msg.includes('User not found')
  )
}

// 인증 오류 자동 복구 래퍼
const withAuthRecovery = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn()
  } catch (error: any) {
    if (isAuthError(error)) {
      console.warn('🔐 인증 오류 발생 - 다시 시도 필요')
      // Supabase v2 SDK는 refreshToken 자동 관리 → 여기서는 단순 재시도만
      return await fn()
    }
    throw error
  }
}

export const useProducts = (filters?: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => withAuthRecovery(() => productService.getProducts(filters)),
    retry: (failureCount, error: any) => {
      if (isAuthError(error)) return false // 인증 오류는 여기서 재시도 안 함
      return failureCount < 5
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: 'always',
    throwOnError: false,
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ productData, storeId }: { productData: ProductFormData; storeId: number }) =>
      withAuthRecovery(() => productService.createProduct(productData, storeId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, productData }: { id: number; productData: Partial<ProductFormData> }) =>
      withAuthRecovery(() => productService.updateProduct(id, productData)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => withAuthRecovery(() => productService.deleteProduct(id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}

export const useToggleSoldOut = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, isSoldOut }: { id: number; isSoldOut: boolean }) =>
      withAuthRecovery(() => productService.toggleSoldOut(id, isSoldOut)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })
}
