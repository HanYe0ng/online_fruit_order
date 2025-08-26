import React from 'react'
import { Card } from '../common'
import { PopularProduct } from '../../types/dashboard'

interface PopularProductsProps {
  products: PopularProduct[] | null
  isLoading: boolean
}

const PopularProducts: React.FC<PopularProductsProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold mb-4">🔥 인기 상품</h3>
        <p className="text-gray-500">데이터가 없습니다.</p>
      </Card>
    )
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">🔥 인기 상품</h3>
      
      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={product.id} className="flex items-center space-x-3">
            <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-bold">
              {index + 1}
            </div>
            
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  이미지
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{product.name}</p>
              <p className="text-sm text-gray-600">
                {product.orderCount}회 주문 • {Math.floor(product.revenue / 10000)}만원
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default PopularProducts