import { useMemo, useState, useEffect } from 'react';
import db from '../data/cites.json';

const tipoLabels = {
  publico: 'CITE Público',
  privado: 'CITE Privado',
  universidad: 'Universidad / OTT',
  incubadora: 'Incubadora / Aceleradora',
  gobierno: 'Entidad de Soporte',
  startup: 'Startup Tecnológica',
  cati: 'Red CATI',
  coworking: 'Espacio de Coworking'
};

function CountUp({ end, duration = 1500 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let target = 0;
    let suffix = '';
    let hasCommas = false;

    if (typeof end === 'number') {
      target = end;
    } else if (typeof end === 'string') {
      if (end.includes(',')) {
        hasCommas = true;
      }
      const match = end.match(/^([\d,]+)(.*)$/);
      if (match) {
        target = parseInt(match[1].replace(/,/g, ''), 10);
        suffix = match[2] || '';
      } else {
        target = parseInt(end, 10) || 0;
      }
    }

    let startTimestamp = null;
    let animationFrameId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = progress * (2 - progress); // easeOutQuad
      const currentCount = Math.floor(easeProgress * target);

      if (hasCommas) {
        setCount(currentCount.toLocaleString('en-US') + suffix);
      } else {
        setCount(currentCount + suffix);
      }

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        if (hasCommas) {
          setCount(target.toLocaleString('en-US') + suffix);
        } else {
          setCount(target + suffix);
        }
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [end, duration]);

  return <>{count}</>;
}

export default function LandingPage({ onEnter }) {
  // Calcular estadísticas dinámicas en base a cites.json
  const stats = useMemo(() => {
    const total = db.cites.length;
    const citesCount = db.cites.filter((c) => c.tipo === 'publico' || c.tipo === 'privado').length;
    const academia = db.cites.filter((c) => c.tipo === 'universidad').length;
    
    // Contar regiones únicas
    const regiones = new Set(db.cites.map(c => c.region.split('/')[0].trim())).size;

    return { total, cites: citesCount, academia, regiones };
  }, []);

  // Estado del formulario de registro
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'cati',
    cadena: 'academia',
    region: '',
    lat: '',
    lng: '',
    descripcion: '',
    servicios: '',
    web: '',
    contactoInfo: ''
  });
  const [generatedJson, setGeneratedJson] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    const cleanName = formData.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const id = `${formData.tipo}-${cleanName.replace(/[^a-z0-9]/g, '-')}`;
    
    const entry = {
      id,
      nombre: formData.nombre,
      tipo: formData.tipo,
      cadena: formData.cadena,
      region: formData.region,
      lat: parseFloat(formData.lat) || 0,
      lng: parseFloat(formData.lng) || 0,
      contacto: {
        telefono: formData.contactoInfo || "Ver web",
        email: formData.contactoInfo || "Ver web",
        web: formData.web || "https://www.itp.gob.pe"
      },
      descripcion: formData.descripcion,
      servicios: formData.servicios ? formData.servicios.split(',').map(s => s.trim()).filter(Boolean) : [],
      ambito: [formData.region],
      fuente: "Registro Externo KhipuNet",
      estado: "operativo"
    };

    setGeneratedJson(JSON.stringify(entry, null, 2));
    setShowSuccessModal(true);
    
    // Desplazarse levemente al cuadro del JSON generado para mejor feedback visual
    const element = document.querySelector('.json-textarea');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-container" style={{ overflowY: 'auto', height: '100%', background: '#070a0e', color: 'var(--text)', position: 'relative' }}>
      {/* Inject custom styles for split Hero layout and pulsing SVG Quipu knots */}
      <style>{`
        .pulse-ring {
          transform-origin: center;
          animation: pulse-ring-anim 3s cubic-bezier(0.25, 0, 0, 1) infinite;
        }
        .pulse-dot {
          animation: blink-anim 2.5s ease-in-out infinite;
        }
        @keyframes pulse-ring-anim {
          0% { r: 5px; opacity: 1; }
          100% { r: 25px; opacity: 0; }
        }
        @keyframes blink-anim {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 8px currentColor); }
          50% { opacity: 0.5; filter: drop-shadow(0 0 2px rgba(255,255,255,0)); }
        }

        /* Coordinated network sway/breath animation */
        .quipu-network-group {
          transform-origin: 50% 15%;
          animation: network-breath 22s ease-in-out infinite alternate;
        }
        @keyframes network-breath {
          0% { transform: scale(0.97) translate(-10px, -5px) rotate(-0.5deg); }
          100% { transform: scale(1.02) translate(10px, 5px) rotate(0.5deg); }
        }

        /* Interactive nodes in background */
        .quipu-node {
          pointer-events: auto;
          cursor: pointer;
          transform-box: fill-box;
          transform-origin: center;
          transition: transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.28s ease, opacity 0.28s ease;
        }
        .quipu-node:hover {
          transform: scale(1.65);
          filter: drop-shadow(0 0 12px currentColor) brightness(1.5);
          opacity: 1 !important;
        }

        .landing-hero-split {
          display: flex;
          align-items: center;
          gap: 50px;
          max-width: 1250px;
          margin: 0 auto;
          padding: 70px 24px 50px;
          position: relative;
          z-index: 1;
        }
        .hero-left {
          flex: 1 1 52%;
          text-align: left;
        }
        .hero-right {
          flex: 1 1 48%;
          min-width: 380px;
        }
        @media (max-width: 950px) {
          .landing-hero-split {
            flex-direction: column;
            text-align: center;
            padding: 40px 20px;
          }
          .hero-left {
            text-align: center;
          }
          .hero-right {
            width: 100%;
            min-width: 100%;
          }
        }

        /* Glassmorphic Metrics Card style */
        .glass-metrics-card {
          background: linear-gradient(135deg, rgba(15, 22, 30, 0.72) 0%, rgba(7, 10, 14, 0.9) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 24px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 20px 45px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255, 255, 255, 0.05);
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .metric-box {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 14px;
          padding: 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }
        .metric-box:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(212, 175, 55, 0.35);
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        .metric-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border-radius: 10px;
          margin-bottom: 10px;
        }
        .metric-number {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1.1;
          color: #fff;
        }
        .metric-label {
          font-size: 0.62rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 4px;
        }
      `}</style>

      {/* 1. Dynamic SVG Quipu Network Background */}
      <div className="quipu-bg-container" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 50% 15%, rgba(12, 22, 35, 0.45) 0%, rgba(7, 10, 14, 1) 85%)'
      }}>
        {/* Fine dark space dust grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.008) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.008) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: 0.5
        }} />

        <svg viewBox="0 0 1200 2400" preserveAspectRatio="xMidYMid slice" style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: 0.65 // Vibrant opacity for the background quipu system
        }}>
          <defs>
            <filter id="bg-quipu-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="4.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <linearGradient id="grad-pink" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f368e0" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f368e0" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4cd137" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#4cd137" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-orange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffa502" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ffa502" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-cyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00bfff" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#00bfff" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9b51e0" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#9b51e0" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff4757" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#ff4757" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="grad-yellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f1c40f" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f1c40f" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Group sways together mimicking the wind blowing the quipu threads */}
          <g className="quipu-network-group">
            {/* Very faint vertical backdrop guides */}
            <line x1="100" y1="0" x2="100" y2="2400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            <line x1="240" y1="0" x2="240" y2="2400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            <line x1="420" y1="0" x2="420" y2="2400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            <line x1="600" y1="0" x2="600" y2="2400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            <line x1="780" y1="0" x2="780" y2="2400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            <line x1="936" y1="0" x2="936" y2="2400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
            <line x1="1080" y1="0" x2="1080" y2="2400" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

            {/* Main top structural thread of the quipu */}
            <line x1="0" y1="60" x2="1200" y2="60" stroke="rgba(212, 175, 55, 0.12)" strokeWidth="2.5" strokeDasharray="6 4" />

            {/* Vertical colored quipu cords (wavy/organic paths extending to y=2400) */}
            <path d="M 100 60 C 120 400, 80 800, 115 1200 C 90 1600, 110 2000, 100 2400" fill="none" stroke="url(#grad-pink)" strokeWidth="1.8" />
            <path d="M 240 60 C 220 450, 260 900, 230 1350 C 255 1800, 230 2100, 240 2400" fill="none" stroke="url(#grad-green)" strokeWidth="1.8" />
            <path d="M 420 60 C 440 400, 400 850, 435 1300 C 410 1750, 430 2150, 420 2400" fill="none" stroke="url(#grad-orange)" strokeWidth="1.8" />
            <path d="M 600 60 C 580 500, 625 1000, 590 1500 C 610 2000, 590 2200, 600 2400" fill="none" stroke="url(#grad-cyan)" strokeWidth="1.8" />
            <path d="M 780 60 C 800 450, 760 950, 795 1450 C 770 1950, 790 2250, 780 2400" fill="none" stroke="url(#grad-purple)" strokeWidth="1.8" />
            <path d="M 936 60 C 910 400, 955 900, 920 1400 C 945 1900, 920 2200, 936 2400" fill="none" stroke="url(#grad-red)" strokeWidth="1.8" />
            <path d="M 1080 60 C 1100 450, 1060 950, 1095 1450 C 1070 1950, 1090 2250, 1080 2400" fill="none" stroke="url(#grad-yellow)" strokeWidth="1.8" />

            {/* Diagonal linkage network (neon/glowing connections between threads) */}
            {/* UPPER SECTION */}
            <line x1="100" y1="280" x2="240" y2="120" stroke="#f368e0" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="240" y1="120" x2="420" y2="180" stroke="#4cd137" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="420" y1="180" x2="600" y2="220" stroke="#ffa502" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#bg-quipu-glow)" />
            <line x1="600" y1="220" x2="780" y2="140" stroke="#00bfff" strokeWidth="1.8" strokeOpacity="0.55" filter="url(#bg-quipu-glow)" />
            <line x1="780" y1="140" x2="936" y2="260" stroke="#9b51e0" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="936" y1="260" x2="1080" y2="200" stroke="#ff4757" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />

            {/* MID-UPPER SECTION */}
            <line x1="1080" y1="680" x2="936" y2="780" stroke="#f1c40f" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="936" y1="780" x2="780" y2="600" stroke="#ff4757" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="780" y1="600" x2="600" y2="850" stroke="#9b51e0" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#bg-quipu-glow)" />
            <line x1="600" y1="850" x2="420" y2="720" stroke="#00bfff" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#bg-quipu-glow)" />
            <line x1="420" y1="720" x2="240" y2="520" stroke="#ffa502" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="240" y1="520" x2="100" y2="650" stroke="#4cd137" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />

            {/* MID-LOWER SECTION */}
            <line x1="100" y1="1100" x2="240" y2="950" stroke="#f368e0" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="240" y1="950" x2="420" y2="1200" stroke="#4cd137" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="420" y1="1200" x2="600" y2="1350" stroke="#ffa502" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#bg-quipu-glow)" />
            <line x1="600" y1="1350" x2="780" y2="1050" stroke="#00bfff" strokeWidth="1.8" strokeOpacity="0.55" filter="url(#bg-quipu-glow)" />
            <line x1="780" y1="1050" x2="936" y2="1250" stroke="#9b51e0" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="936" y1="1250" x2="1080" y2="1150" stroke="#ff4757" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />

            {/* LOWER SECTION */}
            <line x1="1080" y1="1600" x2="936" y2="1700" stroke="#f1c40f" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="936" y1="1700" x2="780" y2="1550" stroke="#ff4757" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="780" y1="1550" x2="600" y2="1850" stroke="#9b51e0" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#bg-quipu-glow)" />
            <line x1="600" y1="1850" x2="420" y2="1750" stroke="#00bfff" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#bg-quipu-glow)" />
            <line x1="420" y1="1750" x2="240" y2="1450" stroke="#ffa502" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="240" y1="1450" x2="100" y2="1650" stroke="#4cd137" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />

            {/* BOTTOM-MOST SECTION */}
            <line x1="100" y1="2100" x2="240" y2="1950" stroke="#f368e0" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="240" y1="1950" x2="420" y2="2200" stroke="#4cd137" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="420" y1="2200" x2="600" y2="2300" stroke="#ffa502" strokeWidth="1.5" strokeOpacity="0.5" filter="url(#bg-quipu-glow)" />
            <line x1="600" y1="2300" x2="780" y2="2050" stroke="#00bfff" strokeWidth="1.8" strokeOpacity="0.55" filter="url(#bg-quipu-glow)" />
            <line x1="780" y1="2050" x2="936" y2="2150" stroke="#9b51e0" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />
            <line x1="936" y1="2150" x2="1080" y2="2250" stroke="#ff4757" strokeWidth="1.5" strokeOpacity="0.45" filter="url(#bg-quipu-glow)" />

            {/* Inner web cross-connections */}
            <line x1="240" y1="240" x2="600" y2="220" stroke="#4cd137" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3 3" />
            <line x1="420" y1="1200" x2="780" y2="1050" stroke="#9b51e0" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3 3" />
            <line x1="600" y1="1350" x2="936" y2="1250" stroke="#ffa502" strokeWidth="1.2" strokeOpacity="0.2" />

            {/* Main nodes (Pulsing and regular knots distributed through y=2400) */}
            {/* PINK NODES (x=100) */}
            <circle cx="100" cy="280" r="6" fill="#f368e0" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#f368e0' }} />
            <circle cx="100" cy="280" fill="transparent" stroke="#f368e0" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="100" cy="650" r="4.5" fill="#f368e0" className="quipu-node" style={{ color: '#f368e0' }} />
            <circle cx="100" cy="1100" r="5" fill="#f368e0" className="quipu-node" style={{ color: '#f368e0' }} />
            <circle cx="100" cy="1650" r="6" fill="#f368e0" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#f368e0' }} />
            <circle cx="100" cy="1650" fill="transparent" stroke="#f368e0" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="100" cy="2100" r="4.5" fill="#f368e0" className="quipu-node" style={{ color: '#f368e0' }} />

            {/* GREEN NODES (x=240) */}
            <circle cx="240" cy="120" r="6" fill="#4cd137" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#4cd137' }} />
            <circle cx="240" cy="120" fill="transparent" stroke="#4cd137" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="240" cy="520" r="5" fill="#4cd137" className="quipu-node" style={{ color: '#4cd137' }} />
            <circle cx="240" cy="950" r="6.5" fill="#4cd137" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#4cd137' }} />
            <circle cx="240" cy="950" fill="transparent" stroke="#4cd137" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="240" cy="1450" r="4.5" fill="#4cd137" className="quipu-node" style={{ color: '#4cd137' }} />
            <circle cx="240" cy="1950" r="5" fill="#4cd137" className="quipu-node" style={{ color: '#4cd137' }} />

            {/* ORANGE NODES (x=420) */}
            <circle cx="420" cy="180" r="6" fill="#ffa502" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#ffa502' }} />
            <circle cx="420" cy="720" r="5" fill="#ffa502" className="quipu-node" style={{ color: '#ffa502' }} />
            <circle cx="420" cy="1200" r="4.5" fill="#ffa502" className="quipu-node" style={{ color: '#ffa502' }} />
            <circle cx="420" cy="1750" r="6.5" fill="#ffa502" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#ffa502' }} />
            <circle cx="420" cy="1750" fill="transparent" stroke="#ffa502" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="420" cy="2200" r="5" fill="#ffa502" className="quipu-node" style={{ color: '#ffa502' }} />

            {/* CYAN NODES (x=600) */}
            <circle cx="600" cy="220" r="7.5" fill="#00bfff" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#00bfff' }} />
            <circle cx="600" cy="220" fill="transparent" stroke="#00bfff" strokeWidth="1.2" strokeOpacity="0.75" className="pulse-ring" />
            <circle cx="600" cy="850" r="6.5" fill="#00bfff" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#00bfff' }} />
            <circle cx="600" cy="850" fill="transparent" stroke="#00bfff" strokeWidth="1.2" strokeOpacity="0.75" className="pulse-ring" />
            <circle cx="600" cy="1350" r="5" fill="#00bfff" className="quipu-node" style={{ color: '#00bfff' }} />
            <circle cx="600" cy="1850" r="5.5" fill="#00bfff" className="quipu-node" style={{ color: '#00bfff' }} />
            <circle cx="600" cy="2300" r="5" fill="#00bfff" className="quipu-node" style={{ color: '#00bfff' }} />

            {/* PURPLE NODES (x=780) */}
            <circle cx="780" cy="140" r="6.5" fill="#9b51e0" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#9b51e0' }} />
            <circle cx="780" cy="140" fill="transparent" stroke="#9b51e0" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="780" cy="600" r="4.5" fill="#9b51e0" className="quipu-node" style={{ color: '#9b51e0' }} />
            <circle cx="780" cy="1050" r="6" fill="#9b51e0" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#9b51e0' }} />
            <circle cx="780" cy="1050" fill="transparent" stroke="#9b51e0" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="780" cy="1550" r="5" fill="#9b51e0" className="quipu-node" style={{ color: '#9b51e0' }} />
            <circle cx="780" cy="2050" r="4.5" fill="#9b51e0" className="quipu-node" style={{ color: '#9b51e0' }} />

            {/* RED NODES (x=936) */}
            <circle cx="936" cy="260" r="6.5" fill="#ff4757" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#ff4757' }} />
            <circle cx="936" cy="260" fill="transparent" stroke="#ff4757" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="936" cy="780" r="5" fill="#ff4757" className="quipu-node" style={{ color: '#ff4757' }} />
            <circle cx="936" cy="1250" r="4.5" fill="#ff4757" className="quipu-node" style={{ color: '#ff4757' }} />
            <circle cx="936" cy="1700" r="6.5" fill="#ff4757" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#ff4757' }} />
            <circle cx="936" cy="1700" fill="transparent" stroke="#ff4757" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="936" cy="2150" r="4" fill="#ff4757" className="quipu-node" style={{ color: '#ff4757' }} />

            {/* YELLOW NODES (x=1080) */}
            <circle cx="1080" cy="200" r="4.5" fill="#f1c40f" className="quipu-node" style={{ color: '#f1c40f' }} />
            <circle cx="1080" cy="680" r="6.5" fill="#f1c40f" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#f1c40f' }} />
            <circle cx="1080" cy="680" fill="transparent" stroke="#f1c40f" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="1080" cy="1150" r="4" fill="#f1c40f" className="quipu-node" style={{ color: '#f1c40f' }} />
            <circle cx="1080" cy="1600" r="6" fill="#f1c40f" filter="url(#bg-quipu-glow)" className="pulse-dot quipu-node" style={{ color: '#f1c40f' }} />
            <circle cx="1080" cy="1600" fill="transparent" stroke="#f1c40f" strokeWidth="1.2" strokeOpacity="0.6" className="pulse-ring" />
            <circle cx="1080" cy="2250" r="5" fill="#f1c40f" className="quipu-node" style={{ color: '#f1c40f' }} />

            {/* Minor structural textural knots */}
            <circle cx="100" cy="150" r="3.2" fill="#f368e0" className="quipu-node" style={{ color: '#f368e0' }} />
            <circle cx="100" cy="450" r="3.2" fill="#f368e0" className="quipu-node" style={{ color: '#f368e0' }} />
            <circle cx="100" cy="900" r="3.2" fill="#f368e0" className="quipu-node" style={{ color: '#f368e0' }} />
            <circle cx="240" cy="320" r="3.2" fill="#4cd137" className="quipu-node" style={{ color: '#4cd137' }} />
            <circle cx="240" cy="720" r="3.2" fill="#4cd137" className="quipu-node" style={{ color: '#4cd137' }} />
            <circle cx="420" cy="900" r="3.2" fill="#ffa502" className="quipu-node" style={{ color: '#ffa502' }} />
            <circle cx="600" cy="410" r="3.2" fill="#00bfff" className="quipu-node" style={{ color: '#00bfff' }} />
            <circle cx="600" cy="1100" r="3.2" fill="#00bfff" className="quipu-node" style={{ color: '#00bfff' }} />
            <circle cx="780" cy="300" r="3.2" fill="#9b51e0" className="quipu-node" style={{ color: '#9b51e0' }} />
            <circle cx="780" cy="850" r="3.2" fill="#9b51e0" className="quipu-node" style={{ color: '#9b51e0' }} />
            <circle cx="936" cy="480" r="3.2" fill="#ff4757" className="quipu-node" style={{ color: '#ff4757' }} />
            <circle cx="1080" cy="500" r="3.2" fill="#f1c40f" className="quipu-node" style={{ color: '#f1c40f' }} />
            <circle cx="1080" cy="1400" r="3.2" fill="#f1c40f" className="quipu-node" style={{ color: '#f1c40f' }} />
          </g>
        </svg>
      </div>

      {/* 2. Header Institucional (CEPAL Style) */}
      <header className="landing-header" style={{ position: 'relative', zIndex: 1 }}>
        <div className="landing-header-inner">
          <div className="landing-logo">
            Khipu<span>Net</span>
          </div>
          <div className="landing-subtitle">
            PLATAFORMA NACIONAL DE TRANSFERENCIA TECNOLÓGICA
          </div>
        </div>
      </header>

      {/* 3. Hero Section (Split layout with typography and Soft UI glassmorphic metrics) */}
      <section className="landing-hero" style={{ background: 'none', padding: 0 }}>
        <div className="landing-hero-split">
          
          {/* Left Column - Typography & Action CTA */}
          <div className="hero-left">
            <span className="hero-tag" style={{ letterSpacing: '0.1em', fontWeight: 700 }}>
              ESTUDIO CARTOGRÁFICO Y ANÁLISIS DE REDES
            </span>
            <h1 className="hero-title" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.1rem',
              fontWeight: 800,
              lineHeight: '1.25',
              marginTop: '12px',
              color: '#fff',
              letterSpacing: '-0.8px'
            }}>
              Red Nacional de Transferencia Tecnológica para la vinculación entre actores del ecosistema de innovación del Perú
            </h1>
            <p className="hero-subtitle" style={{
              fontSize: '0.88rem',
              color: 'var(--muted)',
              lineHeight: '1.5',
              marginTop: '16px',
              marginBottom: '28px',
              maxWidth: '650px'
            }}>
              Un portal nacional unificado diseñado para mapear, conectar y analizar de forma topológica las capacidades del Instituto Tecnológico de la Producción (ITP), la red nacional de CITEs, universidades, empresas innovadoras, startups, incubadoras, Red CATI y espacios de coworking en el territorio peruano.
            </p>
            
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                className="hero-cta" 
                onClick={onEnter}
                style={{
                  boxShadow: '0 4px 20px rgba(212, 175, 55, 0.35)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  margin: 0
                }}
              >
                Ingresar al Portal Cartográfico ➔
              </button>
            </div>

            {/* Badges underneath to humanize information trust */}
            <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '24px', opacity: 0.8 }}>
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🛡️ Información verificada
              </span>
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🕸️ Red en expansión
              </span>
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📂 Datos abiertos y actualizados
              </span>
            </div>
          </div>

          {/* Right Column - Soft UI Glassmorphic metrics grid */}
          <div className="hero-right">
            <div className="glass-metrics-card">
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '18px',
                textAlign: 'left',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: '10px',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--oro)', boxShadow: '0 0 8px var(--oro)' }} />
                Capacidades del Ecosistema Nacional
              </h3>

              <div className="metrics-grid">
                {/* 1. Nodos Mapeados */}
                <div className="metric-box">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(0, 191, 255, 0.1)', color: 'var(--cian)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(0,191,255,0.4))' }}>
                      <circle cx="12" cy="12" r="3" />
                      <circle cx="12" cy="4" r="3" />
                      <circle cx="4" cy="12" r="3" />
                      <circle cx="20" cy="12" r="3" />
                      <circle cx="12" cy="20" r="3" />
                      <path d="M12 7v2M12 15v2M7 12h2M15 12h2" />
                    </svg>
                  </div>
                  <span className="metric-number"><CountUp end={stats.total} /></span>
                  <span className="metric-label">Nodos Mapeados</span>
                </div>

                {/* 2. CITEs */}
                <div className="metric-box">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(76, 209, 55, 0.1)', color: 'var(--verde-claro)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(76,209,55,0.4))' }}>
                      <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M4 10l8-7 8 7" />
                    </svg>
                  </div>
                  <span className="metric-number"><CountUp end={stats.cites} /></span>
                  <span className="metric-label">CITEs Tecnológicos</span>
                </div>

                {/* 3. Academia */}
                <div className="metric-box">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(255, 71, 87, 0.1)', color: '#ff4757' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,71,87,0.4))' }}>
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                    </svg>
                  </div>
                  <span className="metric-number"><CountUp end={stats.academia} /></span>
                  <span className="metric-label">Universidades e I+D</span>
                </div>

                {/* 4. Empresas & Startups */}
                <div className="metric-box">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(243, 104, 224, 0.1)', color: '#f368e0' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(243,104,224,0.4))' }}>
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <span className="metric-number"><CountUp end="1,200+" /></span>
                  <span className="metric-label">Empresas y Startups</span>
                </div>

                {/* 5. Relaciones */}
                <div className="metric-box">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(255, 165, 2, 0.1)', color: '#ffa502' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(255,165,2,0.4))' }}>
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  </div>
                  <span className="metric-number"><CountUp end={126} /></span>
                  <span className="metric-label">Relaciones Activas</span>
                </div>

                {/* 6. Regiones */}
                <div className="metric-box">
                  <div className="metric-icon-wrapper" style={{ background: 'rgba(46, 134, 222, 0.1)', color: '#2e86de' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(46,134,222,0.4))' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <span className="metric-number"><CountUp end={stats.regiones} /></span>
                  <span className="metric-label">Regiones Cubiertas</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Pilares del Proyecto (Características del Portal) */}
      <section className="landing-pillars" style={{ position: 'relative', zIndex: 1, marginTop: '20px' }}>
        <h2 style={{ textAlign: 'center', fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.4rem', marginBottom: '30px' }}>
          Capacidades Analíticas de KhipuNet
        </h2>
        <div className="pillars-inner" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="pillar-card" style={{ background: 'rgba(15, 22, 30, 0.65)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
            <div className="pillar-num">01</div>
            <h3>Cartografía Multimotor</h3>
            <p>
              Alterna entre Google Maps y Leaflet Engine para visualización satelital o topográfica. Mide distancias geodésicas directas con la herramienta de regla interactiva.
            </p>
          </div>
          <div className="pillar-card" style={{ background: 'rgba(15, 22, 30, 0.65)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
            <div className="pillar-num">02</div>
            <h3>Fichas en Hover</h3>
            <p>
              Exploración ágil libre de lag. Coloca el cursor sobre un nodo del mapa o grafo para abrir al instante sus detalles en el panel derecho, o haz clic para fijar la ficha.
            </p>
          </div>
          <div className="pillar-card" style={{ background: 'rgba(15, 22, 30, 0.65)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
            <div className="pillar-num">03</div>
            <h3>Física Topológica Quipu</h3>
            <p>
              Visualiza las relaciones del ecosistema a través de un grafo físico 2D que autoorganiza los nodos según la atracción de sus enlaces y modularidad en comunidades.
            </p>
          </div>
          <div className="pillar-card" style={{ background: 'rgba(15, 22, 30, 0.65)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)' }}>
            <div className="pillar-num">04</div>
            <h3>Estadística Agrupada</h3>
            <p>
              Accede a un panel de métricas formales con tablas de distribución de frecuencias, media aritmética, mediana, moda y desviación estándar para datos cuantitativos y cualitativos.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Sección Súmate al Ecosistema / Formulario de Registro */}
      <section className="landing-registration-section" style={{ position: 'relative', zIndex: 1, background: 'rgba(15, 22, 30, 0.5)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '50px 24px', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', color: '#fff', fontSize: '1.5rem', marginBottom: '8px' }}>
              📩 Súmate a la Red de Innovación
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.5' }}>
              ¿Representas a un CITE, Universidad, Empresa, Startup, Incubadora, Coworking o CATI? Registra los datos de tu institución para incorporarla al mapa interactivo y topológico de KhipuNet.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', marginTop: '20px' }}>
            
            {/* Formulario */}
            <form onSubmit={handleRegisterSubmit} className="glass-form" style={{ background: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Institución</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. CATI UNSA Arequipa" 
                    className="form-input"
                    value={formData.nombre} 
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Actor</label>
                  <select 
                    className="form-input"
                    value={formData.tipo} 
                    onChange={e => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option value="publico">CITE Público</option>
                    <option value="privado">CITE Privado</option>
                    <option value="universidad">Universidad / OTT</option>
                    <option value="empresa">Empresa Innovadora</option>
                    <option value="startup">Startup Tecnológica</option>
                    <option value="incubadora">Incubadora / Aceleradora</option>
                    <option value="cati">Red CATI</option>
                    <option value="coworking">Espacio de Coworking</option>
                    <option value="gobierno">Soporte / Estado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Red / Cadena</label>
                  <select 
                    className="form-input"
                    value={formData.cadena} 
                    onChange={e => setFormData({...formData, cadena: e.target.value})}
                  >
                    <option value="agroindustrial">Agroindustrial / Alimentario</option>
                    <option value="pesquero">Pesquero / Acuícola</option>
                    <option value="forestal">Forestal / Madera</option>
                    <option value="indumentaria">Cuero, Calzado y Textil</option>
                    <option value="productivo">Productivo Multisectorial</option>
                    <option value="materiales">Materiales / Minería / Energía</option>
                    <option value="transversal">Logística / Marketing / Creativas</option>
                    <option value="academia">Academia / OTT / I+D</option>
                    <option value="startup">Startups & Aceleradoras</option>
                    <option value="soporte">Entidades de Soporte (Estado)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Región y Ciudad</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej. Arequipa" 
                    className="form-input"
                    value={formData.region} 
                    onChange={e => setFormData({...formData, region: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Latitud (Y)</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    required 
                    placeholder="Ej. -16.4061" 
                    className="form-input"
                    value={formData.lat} 
                    onChange={e => setFormData({...formData, lat: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitud (X)</label>
                  <input 
                    type="number" 
                    step="0.000001" 
                    required 
                    placeholder="Ej. -71.5248" 
                    className="form-input"
                    value={formData.lng} 
                    onChange={e => setFormData({...formData, lng: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Descripción</label>
                <textarea 
                  required 
                  rows="2" 
                  placeholder="Describe la infraestructura de I+D+i y capacidades..."
                  className="form-input"
                  style={{ fontFamily: 'var(--font-body)', resize: 'vertical' }}
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Servicios Principales (separar por comas)</label>
                <input 
                  type="text" 
                  placeholder="Ej. Ensayos de laboratorio, Asistencia técnica" 
                  className="form-input"
                  value={formData.servicios}
                  onChange={e => setFormData({...formData, servicios: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Sitio Web</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    className="form-input"
                    value={formData.web}
                    onChange={e => setFormData({...formData, web: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Contacto (Teléfono/Correo)</label>
                  <input 
                    type="text" 
                    placeholder="Ej. contacto@unsa.edu.pe" 
                    className="form-input"
                    value={formData.contactoInfo}
                    onChange={e => setFormData({...formData, contactoInfo: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="btn-register-submit" style={{ boxShadow: '0 4px 15px rgba(212,175,55,0.15)' }}>
                Generar Entrada de Datos ➔
              </button>
            </form>

            {/* Panel de Visualización JSON generado */}
            <div className="json-generation-panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                💾 Entrada de Datos Generada (Formato JSON)
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', margin: '0 0 14px', lineHeight: '1.4' }}>
                Completa el formulario de la izquierda. Al presionar el botón, se generará la entrada formateada lista para ser agregada al archivo de base de datos oficial.
              </p>
              <textarea 
                className="json-textarea" 
                readOnly 
                value={generatedJson} 
                placeholder="El código JSON oficial aparecerá aquí una vez que completes el formulario..." 
                style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              {showSuccessModal && (
                <div className="success-toast">
                  <span>✅ <b>¡Registro Generado!</b> Copia el fragmento JSON de arriba y envíalo al administrador del portal KhipuNet para incorporarlo al mapa.</span>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 6. Footer Institucional (CEPAL Style) */}
      <footer className="landing-footer" style={{ borderTop: '1px solid var(--line)', position: 'relative', zIndex: 1 }}>
        <div className="footer-inner">
          <p>© 2026 KhipuNet · Plataforma Nacional de Transferencia Tecnológica y Ecosistema de Innovación.</p>
          <p className="footer-framework">
            Desarrollado bajo el marco del Decreto Legislativo N° 1228 (Ley de CITEs) · En coordinación con el Instituto Tecnológico de la Producción (ITP) y PRODUCE.
          </p>
        </div>
      </footer>
    </div>
  );
}
