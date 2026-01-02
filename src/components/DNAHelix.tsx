import { useEffect, useRef } from 'react';

const DNAHelix = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pairs = 30;
    container.innerHTML = '';

    for (let i = 0; i < pairs; i++) {
      const pair = document.createElement('div');
      pair.className = 'dna-pair';
      pair.style.cssText = `
        position: absolute;
        width: 100%;
        height: 16px;
        top: ${i * 18}px;
        animation: dna-twist 4s ease-in-out infinite;
        animation-delay: ${i * 0.08}s;
      `;

      const left = document.createElement('div');
      left.style.cssText = `
        position: absolute;
        left: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(160 100% 55%), hsl(160 100% 40%));
        box-shadow: 0 0 20px hsl(160 100% 50% / 0.8), 0 0 40px hsl(160 100% 50% / 0.4);
      `;

      const right = document.createElement('div');
      right.style.cssText = `
        position: absolute;
        right: 0;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(180 100% 50%), hsl(180 100% 35%));
        box-shadow: 0 0 20px hsl(180 100% 50% / 0.8), 0 0 40px hsl(180 100% 50% / 0.4);
      `;

      const connector = document.createElement('div');
      connector.style.cssText = `
        position: absolute;
        left: 18px;
        right: 18px;
        top: 50%;
        height: 3px;
        background: linear-gradient(90deg, 
          hsl(160 100% 50% / 0.8), 
          hsl(170 100% 50% / 0.4), 
          hsl(180 100% 50% / 0.8)
        );
        transform: translateY(-50%);
        border-radius: 2px;
      `;

      pair.appendChild(left);
      pair.appendChild(connector);
      pair.appendChild(right);
      container.appendChild(pair);
    }

    const style = document.createElement('style');
    style.id = 'dna-animation-style';
    
    // Remove existing style if present
    const existing = document.getElementById('dna-animation-style');
    if (existing) existing.remove();
    
    style.textContent = `
      @keyframes dna-twist {
        0%, 100% { transform: rotateY(0deg) scaleX(1); }
        25% { transform: rotateY(90deg) scaleX(0.2); }
        50% { transform: rotateY(180deg) scaleX(1); }
        75% { transform: rotateY(270deg) scaleX(0.2); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const styleEl = document.getElementById('dna-animation-style');
      if (styleEl) styleEl.remove();
    };
  }, []);

  return (
    <div className="relative w-40 h-[540px] perspective-[1000px]">
      {/* Glow effects behind helix */}
      <div className="absolute inset-0 blur-3xl">
        <div className="absolute top-1/4 left-0 w-20 h-40 bg-primary/30 rounded-full animate-pulse-glow" />
        <div className="absolute top-1/2 right-0 w-20 h-40 bg-accent/30 rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      />
    </div>
  );
};

export default DNAHelix;