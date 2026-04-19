'use client';

/**
 * France Metropolitan SVG Map Component
 * Ultra-lightweight alternative to Mapbox for high-performance landing pages.
 */
export default function FranceMap() {
  const FRANCE_PATH = "M485.4 75.3l38.2 11.2 5.9-20.7 13.1 7.2 24 29.5 28.9 44.5 1 5.3 12.1 19.3 22.3 19.9 8.2 20.4 1 12.1 11.5 29.8 17.1 23.3 17.7 20.4 20 20.3 35.8 44.7 11.5 19.9 5.6 15.1-4.3 14.8-1 10.8 1.4 15.6 10.4 18.5 12.3 15.5 18.2 16.5 17.1 15.2-1.2 7.7-10.4 15.2 6.5 25.4-4.8 5.6-26.6 6.5v11.7l1.3 7 14.9 14.4 7.5 19 6.2 3.1 27.2-2.7h11.2l20.4 11.2 15.1 13.8 2 12.8-13.8 17.4-4.6 22 2.6 14.8 12.5 18-3 15.4-8.8 12.8-7.9 23.1-6.9 20.6-25.2 24.3 8.3 16.9-9.5 25.1 1.6 11.6L714 624l-31 16.8-10.5 4.9-10.5 9-3.9 17.2-10.5.8L645.7 678l-7.9 15.2-1.6 20.8L616 737.3l-10.1 22.8-3.9 45v31.2l-1.6 14.4h-10.9l-11.8 11.2-15.5 14.1-1.6 10.2L555.2 913l3.6 11.5 17.4 14.4 14.8 15.6.8 14.4-1.3 22.2-7.5 14.1-13.1-.9-5.9-4.8L515.6 980l-28.5-7.8-19.6 1.8-13.1-4.2-21-4.2-16.1-9-19-11.4-15.1-11.6-11.4-15.6-13.1-26.1-6.6-15.9-15.1-16.7-17-10.3-25.3-7.5-12.7-5.9L283 821l-36.9-14L229.4 799l-22.3-9-20.9-14-11.5-12.8-8.2-12.1-18.7-27.8-10.1-14.7-18.3-15.4-2.6-26.3-14.7-21.3L89 642l-21.6-9.8-19.6-15.9-4.9-11.2-1.3-11.2-17.7-12.4-7.5-12.8 15.4-1.3L28.1 556l17-4.1 6.5-12.8 30.7 7.7 20 1 12.1-.8 11.1-7.2L127 534l12.7-4.1 12.1-4.6 22-17.4 17.4-18.3 11.6-11.6 4.8 5.6-4.2 12.8 14.1 11.6 6.5 11.2 5.9.8 11.2-1.3 13.3-8.8 8.4-11.8.4-25.3 1.3-15.6 5.5-16.2 5.3-15.4 10.1-14.7-1.3-10.9-18.3-15.9-12.8-13.3-3.6-11.2L249 344h11.1l11.2-11.6 1.6-11.1-1.3-15.9L254.6 288l8.5-11.2L276 270l14.1 1 10.8-11.2 5.2-11.6-.2-10.9-1.4-11.1 5.9-10.3 8.3-9.1 16.6-8.9 22.8-1 15.5-8.8 6.5-14.1 1.6-25-10.4-26.9L362.8 102l14.3-17.6 15.8-22.3L403.4 46l29.8-4.2 24 10.3z";

  return (
    <div className="france-map-container">
      <svg 
        viewBox="0 0 1000 1000" 
        preserveAspectRatio="xMidYMid meet" 
        className="france-svg"
      >
        <defs>
          <linearGradient id="franceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#00D1FF', stopOpacity: 0.8 }} />
            <stop offset="100%" style={{ stopColor: '#0066FF', stopOpacity: 0.9 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="15" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path 
          d={FRANCE_PATH} 
          fill="url(#franceGradient)" 
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          filter="url(#glow)"
          className="france-path"
        />
        
        {/* Floating circles for "Water" effect */}
        {[...Array(5)].map((_, i) => (
          <circle 
            key={i}
            cx={200 + Math.random() * 600}
            cy={200 + Math.random() * 600}
            r={5 + Math.random() * 15}
            fill="rgba(255,255,255,0.2)"
            className={`bubble bubble-${i}`}
          />
        ))}
      </svg>
    </div>
  );
}
