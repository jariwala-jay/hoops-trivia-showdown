interface CardProps {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export default function Card({ 
  children, 
  className = '', 
  highlight = false,
  onClick 
}: CardProps) {
  const baseClasses = 'card transition-all duration-200';
  const highlightClasses = highlight ? 'card-highlight' : '';
  const clickableClasses = onClick ? 'cursor-pointer hover:scale-105 hover:shadow-2xl' : '';

  return (
    <div 
      className={`${baseClasses} ${highlightClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
} 