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
  return useMutation({
    mutationFn: (orderData: CreateOrderData) => orderService.createOrder(orderData)
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
