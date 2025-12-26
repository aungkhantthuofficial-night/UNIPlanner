import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getPassauWeather } from '../services/geminiService';

interface WelcomePageProps {
  onEnter: () => void;
}

interface FishInstance {
  id: number;
  type: 'huchen' | 'barbe' | 'frauennerfling' | 'bachforelle' | 'schied';
  y: number;
  scale: number;
  duration: number;
  delay: number;
  direction: 'ltr' | 'rtl';
  behavior: 'swim';
  layerIndex: number;
}

interface TurtleInstance {
  id: number;
  y: number;
  scale: number;
  duration: number;
  delay: number;
  direction: 'ltr' | 'rtl';
  layerIndex: number;
}

interface BirdInstance {
  id: number;
  species: 'kingfisher';
  y: number;
  scale: number;
  duration: number;
  delay: number;
  direction: 'ltr' | 'rtl';
  behavior: 'glide' | 'dive';
  layerIndex: number; 
}

interface WeatherTheme {
  name: string;
  bg: string;
  glow: string;
  waves: string[];
  particleMode: 'foam' | 'rain' | 'mist';
  speedFactor: number;
  fishJumpChance: number;
  birdActivity: number;
  glitter: boolean;
}

const WEATHER_THEMES: Record<string, WeatherTheme> = {
  sunny: {
    name: 'sunny',
    bg: '#fefcf0', 
    glow: 'rgba(251, 191, 36, 0.15)',
    waves: ['#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
    particleMode: 'foam',
    speedFactor: 1.0,
    fishJumpChance: 0, 
    birdActivity: 1.5,
    glitter: true
  },
  cloudy: {
    name: 'cloudy',
    bg: '#f1f5f9', 
    glow: 'rgba(148, 163, 184, 0.08)',
    waves: ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b'],
    particleMode: 'mist',
    speedFactor: 0.8,
    fishJumpChance: 0,
    birdActivity: 0.8,
    glitter: false
  },
  rainy: {
    name: 'rainy',
    bg: '#e2e8f0', 
    glow: 'rgba(30, 41, 59, 0.08)',
    waves: ['#94a3b8', '#64748b', '#4b5563', '#374151', '#1f2937', '#111827'],
    particleMode: 'rain',
    speedFactor: 1.4,
    fishJumpChance: 0,
    birdActivity: 0.4,
    glitter: false
  },
  mist: {
    name: 'mist',
    bg: '#f8fafc',
    glow: 'rgba(255, 255, 255, 0.2)',
    waves: ['#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569'],
    particleMode: 'mist',
    speedFactor: 0.5,
    fishJumpChance: 0,
    birdActivity: 0.6,
    glitter: false
  }
};

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; speed: number; delay: number; opacity: number }[]>([]);
  const [fish, setFish] = useState<FishInstance[]>([]);
  const [turtles, setTurtles] = useState<TurtleInstance[]>([]);
  const [birds, setBirds] = useState<BirdInstance[]>([]);
  const [theme, setTheme] = useState<WeatherTheme>(WEATHER_THEMES.sunny);
  const [isExiting, setIsExiting] = useState(false);
  const [rippling, setRippling] = useState(false);

  useEffect(() => {
    getPassauWeather().then(data => {
      const cond = (data.condition || 'sunny').toLowerCase();
      if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('storm') || cond.includes('snow')) {
        setTheme(WEATHER_THEMES.rainy);
      } else if (cond.includes('mist') || cond.includes('fog') || cond.includes('haze')) {
        setTheme(WEATHER_THEMES.mist);
      } else if (cond.includes('cloud') || cond.includes('overcast')) {
        setTheme(WEATHER_THEMES.cloudy);
      } else {
        setTheme(WEATHER_THEMES.sunny);
      }
    }).catch(() => setTheme(WEATHER_THEMES.sunny));
  }, []);

  useEffect(() => {
    // Particle generation based on weather
    let pCount = 80;
    if (theme.particleMode === 'rain') pCount = 200;
    if (theme.particleMode === 'mist') pCount = 100;
    
    const p = Array.from({ length: pCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: theme.particleMode === 'rain' ? Math.random() * -100 : (Math.random() * 80 + 10),
      size: theme.particleMode === 'rain' ? (Math.random() * 1.5 + 0.5) : theme.particleMode === 'mist' ? (Math.random() * 60 + 20) : (Math.random() * 6 + 2),
      speed: theme.particleMode === 'rain' ? (Math.random() * 1.5 + 1.2) : (Math.random() * 0.05 + 0.01),
      delay: Math.random() * -20,
      opacity: theme.particleMode === 'mist' ? (Math.random() * 0.12 + 0.03) : (Math.random() * 0.4 + 0.1)
    }));
    setParticles(p);

    // Fish generation
    const fishTypes: ('huchen' | 'barbe' | 'frauennerfling' | 'bachforelle' | 'schied')[] = [
      'huchen', 'barbe', 'frauennerfling', 'bachforelle', 'schied', 'huchen', 'bachforelle', 'schied', 'barbe', 'frauennerfling', 'bachforelle', 'schied', 'huchen', 'barbe'
    ];
    setFish(fishTypes.map((type, i) => ({
      id: i,
      type,
      y: -(15 + Math.random() * 40), 
      scale: type === 'huchen' ? 1.2 : type === 'schied' ? 1.0 : type === 'barbe' ? 0.8 : 0.6,
      duration: (14 + Math.random() * 22) / theme.speedFactor,
      delay: Math.random() * -120,
      direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
      behavior: 'swim',
      layerIndex: Math.floor(Math.random() * 5) + 1 
    })));

    // Turtle generation - Slower and fewer than fish, specifically for bottom waves
    setTurtles(Array.from({ length: 2 }).map((_, i) => ({
      id: i,
      y: -(25 + Math.random() * 20),
      scale: 0.9 + Math.random() * 0.3,
      duration: (45 + Math.random() * 20) / theme.speedFactor,
      delay: Math.random() * -40,
      direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
      layerIndex: Math.floor(Math.random() * 3) + 3 // Targeted for bottom 3 layers
    })));

    // Bird activity
    const birdPoolSize = 4;
    setBirds(Array.from({ length: birdPoolSize }).map((_, i) => {
      const isDive = Math.random() > 0.6;
      return {
        id: i,
        species: 'kingfisher',
        y: (20 + Math.random() * 30),
        scale: (0.7 + Math.random() * 0.4),
        duration: (6 + Math.random() * 4) / (theme.birdActivity * theme.speedFactor),
        delay: Math.random() * -100,
        direction: Math.random() > 0.5 ? 'ltr' : 'rtl',
        behavior: isDive ? 'dive' : 'glide',
        layerIndex: Math.floor(Math.random() * 2) + 1 
      };
    }));
  }, [theme]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isExiting) return;
    const x = (e.clientX - window.innerWidth / 2);
    const y = (e.clientY - window.innerHeight / 2);
    document.documentElement.style.setProperty('--mx', `${x}px`);
    document.documentElement.style.setProperty('--my', `${y}px`);
  }, [isExiting]);

  const handleEnterClick = () => {
    setRippling(true);
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 1200);
  };

  const waveLayers = useMemo(() => [
    { id: 'wave-1', color: theme.waves[0], opacity: 0.06, height: '70%', duration: `${42 / theme.speedFactor}s`, delay: '0s', offset: -0.002, path: "M0,60 C150,80 350,20 500,60 C650,100 850,40 1000,60 L1000,100 L0,100 Z" },
    { id: 'wave-2', color: theme.waves[1], opacity: 0.12, height: '62%', duration: `${36 / theme.speedFactor}s`, delay: '-6s', offset: -0.006, path: "M0,50 C200,90 400,10 600,50 C800,90 900,10 1000,50 L1000,100 L0,100 Z" },
    { id: 'wave-3', color: theme.waves[2], opacity: 0.18, height: '52%', duration: `${30 / theme.speedFactor}s`, delay: '-12s', offset: -0.015, path: "M0,45 C150,85 450,15 650,45 C850,75 950,25 1000,45 L1000,100 L0,100 Z" },
    { id: 'wave-4', color: theme.waves[3], opacity: 0.28, height: '42%', duration: `${24 / theme.speedFactor}s`, delay: '-18s', offset: -0.035, path: "M0,55 C250,95 450,15 700,55 C950,95 1000,15 1000,55 L1000,100 L0,100 Z" },
    { id: 'wave-5', color: theme.waves[4], opacity: 0.45, height: '32%', duration: `${18 / theme.speedFactor}s`, delay: '-24s', offset: -0.07, path: "M0,50 C300,80 500,20 800,50 C950,75 1000,30 1000,50 L1000,100 L0,100 Z" },
    { id: 'wave-6', color: theme.waves[5], opacity: 0.65, height: '22%', duration: `${14 / theme.speedFactor}s`, delay: '-30s', offset: -0.12, path: "M0,40 C200,70 400,10 600,40 C800,70 900,10 1000,40 L1000,100 L0,100 Z" },
  ], [theme]);

  const renderFishIcon = (type: string) => {
    switch (type) {
      case 'huchen': return <path d="M5,10 C15,5 35,2 55,5 C70,8 75,5 80,10 C75,15 70,12 55,15 C35,18 15,15 5,10 M78,10 L88,4 L88,16 Z" fill="currentColor" />;
      case 'barbe': return <path d="M4,10 C15,3 40,3 60,10 C40,17 15,17 4,10 M58,10 L68,5 L68,15 Z" fill="currentColor" />;
      case 'frauennerfling': return <path d="M6,10 C20,1 45,1 60,10 C45,19 20,19 6,10 M58,10 L66,4 L66,16 Z" fill="currentColor" />;
      case 'bachforelle': return <path d="M5,10 C15,4 35,4 50,10 C35,16 15,16 5,10 M48,10 L58,5 L58,15 Z" fill="currentColor" />;
      case 'schied': return <path d="M3,10 C15,4 40,4 60,10 C40,16 15,16 3,10 M58,10 L68,6 L68,14 Z" fill="currentColor" />;
      default: return null;
    }
  };

  const renderTurtleIcon = () => {
    return (
      <g fill="currentColor">
        <path d="M10,20 C10,12 50,12 50,20 L50,23 C50,30 10,30 10,23 Z" />
        <path d="M20,17 Q30,14 40,17" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
        <path d="M18,21 Q30,19 42,21" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
        <path d="M50,19 C58,19 62,23 58,27 C54,27 50,23 50,21" />
        <path d="M16,24 C10,29 12,33 18,29" className="turtle-paddle" />
        <path d="M44,24 C50,29 48,33 42,29" className="turtle-paddle-delay" />
      </g>
    );
  };

  const renderBirdIcon = () => {
    return (
      <g fill="currentColor">
        <path d="M10,15 C20,5 40,5 50,15 L45,18 C35,12 15,12 10,15 Z" className="wing-flap-fast" />
        <path d="M5,20 C15,18 25,18 35,20 L32,23 C22,21 12,21 5,20 Z" className="wing-flap-fast-rev" />
        <path d="M48,15 L62,15 L52,18 Z" /> 
        <circle cx="45" cy="14" r="1.5" />
      </g>
    );
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-center relative overflow-hidden select-none cursor-default transition-all duration-[1200ms] ${isExiting ? 'bg-slate-50' : ''}`}
      style={{ backgroundColor: isExiting ? '#f8f5f0' : theme.bg }}
      onMouseMove={handleMouseMove}
    >
      <style>{`
        .three-rivers-glow {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at 10% 80%, ${theme.glow} 0%, transparent 60%),
            radial-gradient(circle at 90% 80%, ${theme.glow} 0%, transparent 60%);
          pointer-events: none;
          z-index: 1;
          transition: opacity 1.5s ease;
          opacity: ${isExiting ? 0 : 1};
        }

        .wave-crest-lighting {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(circle at calc(50% + var(--mx) * 0.12) calc(60% + var(--my) * 0.12), rgba(255,255,255,0.25) 0%, transparent 70%);
          mix-blend-mode: soft-light;
          pointer-events: none;
          z-index: 15;
          opacity: ${isExiting ? 0 : 1};
          transition: opacity 1s ease;
        }

        .glitter-sparkles {
          position: absolute;
          inset: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMTAwIDEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIwLjQiIGZpbGw9IndoaXRlIiAvPjwvc3ZnPg==');
          background-size: 180px 180px;
          opacity: ${theme.glitter && !isExiting ? 0.35 : 0};
          mix-blend-mode: screen;
          pointer-events: none;
          z-index: 16;
          animation: glitter-pan 120s linear infinite;
          transition: opacity 0.5s ease;
        }

        @keyframes swim-ltr { 
          0% { transform: translateX(-400px) scaleX(-1) translateY(0); } 
          100% { transform: translateX(calc(100vw + 400px)) scaleX(-1) translateY(0); } 
        }
        @keyframes swim-rtl { 
          0% { transform: translateX(calc(100vw + 400px)) scaleX(1) translateY(0); } 
          100% { transform: translateX(-400px) scaleX(1) translateY(0); } 
        }

        @keyframes turtle-ltr {
          0% { transform: translateX(-200px) scaleX(1) translateY(0); }
          50% { transform: translateX(calc(50vw)) scaleX(1) translateY(-12px) rotate(2deg); }
          100% { transform: translateX(calc(100vw + 200px)) scaleX(1) translateY(0); }
        }
        @keyframes turtle-rtl {
          0% { transform: translateX(calc(100vw + 200px)) scaleX(-1) translateY(0); }
          50% { transform: translateX(calc(50vw)) scaleX(-1) translateY(-12px) rotate(-2deg); }
          100% { transform: translateX(-200px) scaleX(-1) translateY(0); }
        }

        .turtle-paddle { animation: turtle-paddle 2.2s ease-in-out infinite alternate; transform-origin: top left; }
        .turtle-paddle-delay { animation: turtle-paddle 2.2s ease-in-out infinite alternate-reverse; transform-origin: top right; }
        @keyframes turtle-paddle { from { transform: rotate(-15deg); } to { transform: rotate(15deg); } }

        @keyframes fly-glide-ltr { from { transform: translateX(-400px) scaleX(1) translateY(0); } to { transform: translateX(calc(100vw + 400px)) scaleX(1) translateY(0); } }
        @keyframes fly-glide-rtl { from { transform: translateX(calc(100vw + 400px)) scaleX(-1) translateY(0); } to { transform: translateX(-400px) scaleX(-1) translateY(0); } }

        @keyframes fly-dive-ltr {
          0% { transform: translateX(-400px) scaleX(1) translateY(0) rotate(0deg); }
          50% { transform: translateX(50vw) scaleX(1) translateY(60px) rotate(30deg); }
          100% { transform: translateX(calc(100vw + 400px)) scaleX(1) translateY(0) rotate(0deg); }
        }
        @keyframes fly-dive-rtl {
          0% { transform: translateX(calc(100vw + 400px)) scaleX(-1) translateY(0) rotate(0deg); }
          50% { transform: translateX(50vw) scaleX(-1) translateY(60px) rotate(-30deg); }
          100% { transform: translateX(-200px) scaleX(-1) translateY(0) rotate(0deg); }
        }

        @keyframes button-fly-away {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; filter: blur(0); }
          20% { transform: translate(-20px, 30px) scale(0.9) rotate(-15deg); opacity: 1; }
          100% { transform: translate(500px, -600px) scale(0.1) rotate(60deg); opacity: 0; filter: blur(4px); }
        }

        .button-exit-animation {
          animation: button-fly-away 1.2s cubic-bezier(0.45, 0, 0.55, 1) forwards !important;
        }

        .wing-flap-fast { animation: wing-flap-fast 0.08s ease-in-out infinite alternate; transform-origin: center; }
        @keyframes wing-flap-fast { from { transform: rotate(-35deg); } to { transform: rotate(35deg); } }
        .wing-flap-fast-rev { animation: wing-flap-fast-rev 0.08s ease-in-out infinite alternate-reverse; transform-origin: center; }
        @keyframes wing-flap-fast-rev { from { transform: rotate(30deg); } to { transform: rotate(-30deg); } }

        .fish-instance { position: absolute; opacity: 0.3; mix-blend-mode: multiply; pointer-events: none; will-change: transform; transition: opacity 0.8s ease; }
        .turtle-instance { position: absolute; opacity: 0.25; mix-blend-mode: multiply; pointer-events: none; will-change: transform; transition: opacity 0.8s ease; }
        
        .bird-instance { position: absolute; pointer-events: none; will-change: transform; transition: opacity 0.5s; }
        .kingfisher-color { color: #06b6d4; filter: drop-shadow(0 4px 6px rgba(6, 182, 212, 0.4)); }

        .parallax-wave { will-change: transform; transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
        .wave-organic { animation: fluid-wave-complex 16s ease-in-out infinite; }
        @keyframes fluid-wave-complex { 0%, 100% { transform: scaleY(1) translateY(0); } 50% { transform: scaleY(1.05) translateY(-5px); } }
        
        @keyframes rain-fall { from { transform: translateY(-120vh); } to { transform: translateY(120vh); } }
        
        .rain-streak {
          position: absolute;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.6));
          border-radius: 2px;
          pointer-events: none;
          z-index: 28;
        }

        .mist-particle {
          position: absolute;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(10px);
          pointer-events: none;
          z-index: 28;
          animation: mist-float 30s linear infinite;
        }

        .foam-particle {
          position: absolute;
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          pointer-events: none;
          z-index: 28;
          animation: foam-rise 8s ease-in-out infinite alternate;
        }

        @keyframes float-hero { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        
        .wave-exit {
          transform: translateY(100%) !important;
          transition: transform 1.5s cubic-bezier(0.76, 0, 0.24, 1) !important;
        }

        .ui-exit {
          opacity: 0 !important;
          transform: translateY(-30px) !important;
          transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        @keyframes expandRipple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        .ripple-overlay {
          position: absolute;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 100;
          animation: expandRipple 1.2s ease-out forwards;
        }
      `}</style>

      {rippling && <div className="ripple-overlay" />}
      <div className="three-rivers-glow"></div>
      <div className="wave-crest-lighting"></div>
      <div className="glitter-sparkles"></div>

      <div className="relative z-30 flex flex-col items-center justify-center h-screen fade-in-ui space-y-12">
        {/* Minimalist Centered Titles */}
        <div className={`text-center space-y-4 transition-all duration-1000 transform ${isExiting ? 'opacity-0 translate-y-[-40px]' : 'opacity-100 translate-y-0'}`}>
           <h1 className="text-[10px] font-bold uppercase tracking-[0.6em] text-slate-400/60">Universität Passau</h1>
           <h2 className="text-[20px] md:text-[24px] font-bold uppercase tracking-[0.3em] text-slate-900/10 leading-tight">
             UniPlanner Journey Tracker
           </h2>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleEnterClick}
          className={`group relative flex flex-col items-center justify-center focus:outline-none transition-transform duration-1000 ${isExiting ? 'button-exit-animation' : 'animate-[float-hero_10s_ease-in-out_infinite]'}`}
        >
          <div className="relative overflow-hidden px-16 py-8">
             {isExiting && (
               <div className="absolute inset-0 flex items-center justify-center z-10 scale-150 animate-pulse">
                  <svg width={80} height={50} viewBox="0 0 100 40" className="text-slate-900/40">
                    {renderBirdIcon()}
                  </svg>
               </div>
             )}
             <span className={`text-[16px] font-bold uppercase tracking-[0.8em] text-slate-400/80 transition-all duration-700 ml-[0.8em] ${isExiting ? 'opacity-0 scale-50' : 'group-hover:text-slate-900/90'}`}>
               Enter
             </span>
             <div className={`absolute bottom-2 left-1/2 w-8 h-[1px] bg-slate-900/30 -translate-x-1/2 transition-transform duration-700 origin-center ${isExiting ? 'scale-x-0' : 'scale-x-0 group-hover:scale-x-150'}`}></div>
          </div>
        </button>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">
        {waveLayers.map((wave, index) => (
          <React.Fragment key={wave.id}>
            {/* Birds */}
            {birds.filter(b => b.layerIndex === index).map(b => (
              <div 
                key={b.id}
                className="bird-instance kingfisher-color"
                style={{
                  top: `${b.y}%`,
                  left: 0,
                  animation: `fly-${b.behavior}-${b.direction} ${isExiting ? b.duration * 0.4 : b.duration}s linear infinite`,
                  animationDelay: `${b.delay}s`,
                  zIndex: index * 10 + 1, 
                  transform: `scale(${b.scale})`,
                  opacity: (theme.birdActivity < 0.5 || isExiting) ? 0.2 : 0.8
                }}
              >
                <svg width={60} height={40} viewBox="0 0 100 40">
                  {renderBirdIcon()}
                </svg>
              </div>
            ))}

            {/* Turtles - specifically in bottom waves */}
            {turtles.filter(t => t.layerIndex === index).map(t => (
              <div 
                key={t.id}
                className="turtle-instance"
                style={{
                  bottom: `calc(${wave.height} + ${t.y}px)`, 
                  left: 0,
                  animation: `turtle-${t.direction} ${isExiting ? t.duration * 0.4 : t.duration}s linear infinite`,
                  animationDelay: `${t.delay}s`,
                  zIndex: index * 10 + 2, // Behind fish, inside waves
                  opacity: isExiting ? 0 : 0.25
                }}
              >
                <svg width={70 * t.scale} height={40 * t.scale} viewBox="0 0 70 40" style={{ color: '#064e3b' }}>
                  {renderTurtleIcon()}
                </svg>
              </div>
            ))}

            {/* Fish */}
            {fish.filter(f => f.layerIndex === index).map(f => (
              <div 
                key={f.id}
                className="fish-instance"
                style={{
                  bottom: `calc(${wave.height} + ${f.y}px)`, 
                  left: 0,
                  animation: `${f.behavior}-${f.direction} ${isExiting ? f.duration * 0.25 : f.duration}s linear infinite`,
                  animationDelay: `${f.delay}s`,
                  zIndex: index * 10 + 5,
                  opacity: isExiting ? 0 : 0.3
                }}
              >
                <svg width={90 * f.scale} height={30 * f.scale} viewBox="0 0 90 30" style={{ color: '#0f172a' }}>
                  {renderFishIcon(f.type)}
                </svg>
              </div>
            ))}

            <div 
              className={`absolute bottom-0 left-[-15%] w-[130%] parallax-wave ${isExiting ? 'wave-exit' : ''}`}
              style={{ 
                height: wave.height, 
                opacity: wave.opacity,
                zIndex: index * 10,
                transform: `translate(calc(var(--mx) * ${wave.offset}), calc(var(--my) * ${wave.offset * 0.4}))`
              }}
            >
              <svg 
                className="w-full h-full wave-organic" 
                viewBox="0 0 1000 100" 
                preserveAspectRatio="none"
                style={{ 
                  animationDuration: wave.duration, 
                  animationDelay: wave.delay,
                  filter: index < 3 ? 'blur(2px)' : 'none' 
                }}
              >
                <path d={wave.path} fill={wave.color} />
              </svg>
            </div>
          </React.Fragment>
        ))}
        <div className={`absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white/10 to-transparent z-[90] transition-opacity duration-1000 ${isExiting ? 'opacity-0' : 'opacity-100'}`}></div>
      </div>

      <div className={`absolute inset-0 z-[28] pointer-events-none transition-opacity duration-1000 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        {particles.map(p => (
          <div 
            key={p.id}
            className={
              theme.particleMode === 'rain' ? 'rain-streak' : 
              theme.particleMode === 'mist' ? 'mist-particle' : 
              'foam-particle'
            }
            style={{
              width: theme.particleMode === 'rain' ? '1px' : `${p.size}px`,
              height: theme.particleMode === 'rain' ? '40px' : `${p.size}px`,
              left: `${p.x}%`,
              top: theme.particleMode === 'rain' ? 'auto' : `${p.y}%`,
              opacity: p.opacity,
              animation: theme.particleMode === 'rain' ? `rain-fall ${p.speed}s linear infinite` : undefined,
              animationDelay: `${p.delay}s`,
              transform: theme.particleMode !== 'rain' ? `translate(calc(var(--mx) * ${p.speed}), calc(var(--my) * ${p.speed}))` : undefined
            }}
          />
        ))}
      </div>
    </div>
  );
};