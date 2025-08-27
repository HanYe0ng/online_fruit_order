import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { orderService } from '../services/order'
import { CreateOrderData } from '../types/order'

export const useSearchApartments = (query: string) => {
  return useQuery({
    queryKey: ['apartments', query],
    queryFn: () => orderService.searchApartments(query),
    enabled: query.length > 1
  })
}

export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (orderData: CreateOrderData) => orderService.createOrder(orderData),
    onSuccess: () => {
      // 주문 성공 시 상품 목록과 주문 목록을 새로고침 (재고가 업데이트되었으므로)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}

export const useOrders = (storeId?: number) => {
  return useQuery({
    queryKey: ['orders', storeId],
    queryFn: () => orderService.getOrders(storeId)
  })
}

export const useOrderDetails = (orderId: number) => {
  return useQuery({
    queryKey: ['order-details', orderId],
    queryFn: () => orderService.getOrderDetails(orderId),
    enabled: !!orderId
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      orderService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    }
  })
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: number) => orderService.cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['products'] }) // 재고가 복구되었으므로 상품 정보도 새로고침
    }
  })
}
