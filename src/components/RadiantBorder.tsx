
interface RadiantBorderProps {
    children: React.ReactNode;
    isSelected?: boolean;
    className?: string;
  }
  
  export default function RadiantBorder({ 
    children, 
    isSelected = false,
    className = ''
  }: RadiantBorderProps) {
    const brightness = 0.8;
    const radiantAnimationDuration = 4;
    const pulseAnimationDuration = 3;
  
    // Rainbow/prismatic gradient like TopShot
    const radiantBg = `conic-gradient(
      from 180deg,
      transparent 0deg,
      rgba(255, 0, 128, ${brightness}) 45deg,
      rgba(0, 255, 255, ${brightness}) 90deg,
      rgba(128, 0, 255, ${brightness}) 135deg,
      rgba(255, 255, 0, ${brightness}) 180deg,
      rgba(255, 128, 0, ${brightness}) 225deg,
      rgba(255, 0, 128, ${brightness}) 270deg,
      transparent 315deg,
      transparent 360deg
    )`;
  
    const containerStyle: React.CSSProperties = {
      position: 'relative',
      borderRadius: '8px',
      overflow: 'hidden',
      padding: '1px',
      background: 'rgb(55, 65, 81)', // gray-700
    };
  
    const beforeStyle: React.CSSProperties = {
      content: '""',
      position: 'absolute',
      left: isSelected ? '0' : '-100%',
      top: isSelected ? '0' : '-100%',
      width: isSelected ? '100%' : '300%',
      height: isSelected ? '100%' : '300%',
      backgroundRepeat: 'no-repeat',
      backgroundImage: radiantBg,
      transition: 'opacity 0.5s ease-out, left 0.5s ease-out, top 0.5s ease-out, width 0.5s ease-out, height 0.5s ease-out, background-image 0.5s ease-out, background 0.5s ease-out',
      zIndex: 0,
    };
  
    const contentStyle: React.CSSProperties = {
      position: 'relative',
      zIndex: 1,
      background: 'rgba(0, 0, 0, 1)',
      borderRadius: '8px',
      width: '100%',
      height: '100%',
    };
  
    return (
      <div 
        style={containerStyle}
        className={`radiant-border ${className}`}
        onMouseEnter={(e) => {
          const before = e.currentTarget.querySelector('.radiant-before') as HTMLElement;
          if (before) {
            before.style.left = '0';
            before.style.top = '0';
            before.style.width = '100%';
            before.style.height = '100%';
            before.style.transform = 'none';
            before.style.animation = `radiant-initial-glow 0.5s ease-out forwards, radiant-pulse-glow ${pulseAnimationDuration}s linear infinite 0.3s`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            const before = e.currentTarget.querySelector('.radiant-before') as HTMLElement;
            if (before) {
              before.style.left = '-100%';
              before.style.top = '-100%';
              before.style.width = '300%';
              before.style.height = '300%';
              before.style.animation = `radiant-spin ${radiantAnimationDuration}s ease-in-out infinite`;
            }
          }
        }}
      >
        <div 
          className="radiant-before" 
          style={{
            ...beforeStyle,
            animation: isSelected 
              ? `radiant-initial-glow 0.5s ease-out forwards, radiant-pulse-glow ${pulseAnimationDuration}s linear infinite 0.3s`
              : `radiant-spin ${radiantAnimationDuration}s ease-in-out infinite`
          }}
        ></div>
        
        <div style={contentStyle}>
          {children}
        </div>
        
        <style jsx>{`
          @keyframes radiant-spin {
            0% { transform: rotate(0deg); opacity: 1; }
            50% { opacity: 0.6; }
            70% { opacity: 0.2; }
            100% { transform: rotate(360deg); opacity: 1; }
          }
          
          @keyframes radiant-initial-glow {
            0% {
              background: ${radiantBg.replace(brightness.toString(), (brightness * 0.5).toString())};
              box-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
            }
            100% {
              background: ${radiantBg};
              box-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
            }
          }
          
          @keyframes radiant-pulse-glow {
            0% {
              background: ${radiantBg};
              box-shadow: 0 0 25px rgba(255, 255, 255, 0.6);
            }
            50% {
              background: ${radiantBg.replace(brightness.toString(), (brightness * 0.5).toString())};
              box-shadow: 0 0 25px rgba(255, 255, 255, 0.3);
            }
            100% {
              background: ${radiantBg};
              box-shadow: 0 0 25px rgba(255, 255, 255, 0.6);
            }
          }
        `}</style>
      </div>
    );
  }