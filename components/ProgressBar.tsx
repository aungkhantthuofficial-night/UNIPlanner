
import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  colorClass?: string;
  label?: string;
  showText?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  current, 
  max, 
  colorClass = "bg-blue-600", 
  label,
  showText = true 
}) => {
  const [widthPercentage, setWidthPercentage] = useState(0);

  useEffect(() => {
    const target = Math.min(100, Math.max(0, (current / max) * 100));
    const timer = setTimeout(() => {
      setWidthPercentage(target);
    }, 100);
    return () => clearTimeout(timer);
  }, [current, max]);

  const isComplete = current >= max;
  const isZero = current === 0;
  const isWave = colorClass.includes('wave-progress-fill');

  return (
    <div className="w-full group select-none">
      {showText && (
        <div className="flex justify-between mb-2 items-end">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          <div className="text-right">
             <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-slate-800'}`}>
               {Number(current)}
             </span>
             <span className="text-xs text-slate-500 font-medium ml-1">/ {max} ECTS</span>
          </div>
        </div>
      )}
      
      <div className="w-full bg-slate-100 rounded-full h-4 p-1 shadow-inner border border-slate-200 overflow-hidden relative">
        <div className="absolute inset-0 flex justify-evenly opacity-10 pointer-events-none">
            <div className="h-full w-px bg-slate-400"></div>
            <div className="h-full w-px bg-slate-400"></div>
            <div className="h-full w-px bg-slate-400"></div>
            <div className="h-full w-px bg-slate-400"></div>
        </div>

        <div 
          className={`h-full rounded-full transition-all duration-1000 ease-out relative ${colorClass} ${isZero ? 'opacity-0' : 'opacity-100'}`} 
          style={{ 
            width: `${widthPercentage}%`,
            minWidth: isZero ? '0' : '8px'
          }}
        >
          {/* Only show standard stripes if NOT using the wave-progress-fill */}
          {!isComplete && !isZero && !isWave && (
            <div 
               className="absolute inset-0 animate-stripes opacity-30"
               style={{
                 backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,0.3) 25%,transparent 25%,transparent 50%,rgba(255,255,255,0.3) 50%,rgba(255,255,255,0.3) 75%,transparent 75%,transparent)',
                 backgroundSize: '1rem 1rem'
               }}
            />
          )}

          {isComplete && (
            <div className="absolute inset-0 w-full h-full overflow-hidden rounded-full">
               <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-shine" />
            </div>
          )}
          
          {!isComplete && !isZero && (
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 shadow-[0_0_10px_2px_rgba(255,255,255,0.5)]" />
          )}
        </div>
      </div>
    </div>
  );
};
