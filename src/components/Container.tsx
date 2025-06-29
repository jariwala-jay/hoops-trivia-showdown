interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: React.CSSProperties;
}

export default function Container({ 
  children, 
  className = '', 
  size = 'lg',
  style = {}
}: ContainerProps) {
  const maxWidths = {
    sm: '28rem',
    md: '42rem', 
    lg: '48rem',
    xl: '80rem'
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: maxWidths[size],
    margin: '0 auto',
    padding: '1rem',
    ...style
  };

  return (
    <div className={className} style={containerStyle}>
      {children}
    </div>
  );
} 