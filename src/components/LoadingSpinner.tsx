interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {/* Basketball Spinner */}
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-4 border-gray-600 border-t-accent animate-spin`}></div>
        <div className="absolute inset-0 flex items-center justify-center text-xs">
          🏀
        </div>
      </div>
      
      {/* Loading Text */}
      {text && (
        <div className={`text-text-light font-medium ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </div>
      )}
    </div>
  );
} 