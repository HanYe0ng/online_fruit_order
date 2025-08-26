import React from 'react'

interface SkeletonLoaderProps {
  width?: string
  height?: string
  className?: string
  rows?: number
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  rows = 1
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-gray-200 rounded"
          style={{ width, height }}
        />
      ))}
    </div>
  )
}

// 미리 정의된 스켈레톤 컴포넌트들
export const ProductCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse">
    <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded w-full mt-4" />
    </div>
  </div>
)

export const OrderCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse">
    <div className="flex justify-between items-start mb-3">
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="h-6 bg-gray-200 rounded w-16" />
    </div>
    <div className="flex space-x-2">
      <div className="h-8 bg-gray-200 rounded flex-1" />
      <div className="h-8 bg-gray-200 rounded flex-1" />
    </div>
  </div>
)

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: cols }).map((_, colIndex) => (
          <div 
            key={colIndex} 
            className="h-4 bg-gray-200 rounded animate-pulse flex-1" 
          />
        ))}
      </div>
    ))}
  </div>
)

export default SkeletonLoader