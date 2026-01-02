import { useEffect, useRef } from 'react';

const DNAHelix = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const pairs = 20;
    container.innerHTML = '';

    for (let i = 0; i < pairs; i++) {
      const pair = document.createElement('div');
      pair.className = 'dna-pair';
      pair.style.cssText = `
        position: absolute;
        width: 100%;
        height: 12px;
        top: ${i * 20}px;
        animation: dna-twist 3s ease-in-out infinite;
        animation-delay: ${i * 0.1}s;
      `;

      const left = document.createElement('div');
      left.style.cssText = `
        position: absolute;
        left: 0;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(175 70% 45%), hsl(175 70% 35%));
        box-shadow: 0 0 10px hsl(175 70% 45% / 0.5);
      `;

      const right = document.createElement('div');
      right.style.cssText = `
        position: absolute;
        right: 0;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(150 80% 50%), hsl(150 80% 40%));
        box-shadow: 0 0 10px hsl(150 80% 45% / 0.5);
      `;

      const connector = document.createElement('div');
      connector.style.cssText = `
        position: absolute;
        left: 14px;
        right: 14px;
        top: 50%;
        height: 2px;
        background: linear-gradient(90deg, 
          hsl(175 70% 45% / 0.6), 
          hsl(160 75% 45% / 0.3), 
          hsl(150 80% 45% / 0.6)
        );
        transform: translateY(-50%);
      `;

      pair.appendChild(left);
      pair.appendChild(connector);
      pair.appendChild(right);
      container.appendChild(pair);
    }

    const style = document.createElement('style');
    style.textContent = `
      @keyframes dna-twist {
        0%, 100% { transform: rotateY(0deg) scaleX(1); }
        25% { transform: rotateY(90deg) scaleX(0.3); }
        50% { transform: rotateY(180deg) scaleX(1); }
        75% { transform: rotateY(270deg) scaleX(0.3); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative w-24 h-[400px] perspective-[1000px]">
      <div 
        ref={containerRef}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      />
    </div>
  );
};

export default DNAHelix;
