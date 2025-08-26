import React from 'react'

export interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-lg'
  }
  
  const classes = `
    bg-white rounded-lg border border-gray-200 
    ${paddingClasses[padding]} 
    ${shadowClasses[shadow]}
    ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
    ${className}
  `
  
  return (
    <div className={classes}>
      {children}
    </div>
  )
}

export default Card