import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function AdminPanel({ onExit }) {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchSolicitudes();
    }
  }, [session]);

  const fetchSolicitudes = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching solicitudes:', error);
    } else {
      setSolicitudes(data || []);
    }
    setLoadingData(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setAuthError(error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const updateEstado = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({ estado: nuevoEstado })
      .eq('id', id);
    
    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      // Remove from the local list
      setSolicitudes(prev => prev.filter(s => s.id !== id));
    }
  };

  if (loadingAuth) {
    return <div style={{ padding: '2rem', color: '#fff', textAlign: 'center' }}>Cargando administrador...</div>;
  }

  // --- LOGIN SCREEN ---
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070a0e', color: '#fff' }}>
        <div style={{ background: '#0f161e', padding: '2.5rem', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ margin: '0 0 1.5rem', textAlign: 'center', fontFamily: 'var(--font-display)' }}>KhipuNet Admin</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--muted)' }}>Correo Electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                required 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--muted)' }}>Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff' }}
                required 
              />
            </div>
            {authError && <div style={{ color: '#ff4757', fontSize: '0.85rem', textAlign: 'center' }}>{authError}</div>}
            <button type="submit" style={{ padding: '0.9rem', borderRadius: '6px', border: 'none', background: 'var(--oro)', color: '#000', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>
              Iniciar Sesión
            </button>
            <button type="button" onClick={onExit} style={{ padding: '0.6rem', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
              ← Volver al mapa público
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- ADMIN DASHBOARD ---
  return (
    <div style={{ minHeight: '100vh', background: '#070a0e', color: '#fff', padding: '2rem', fontFamily: 'var(--font-body)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>KhipuNet Panel de Aprobación</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{session.user.email}</span>
          <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '4px', cursor: 'pointer' }}>
            Cerrar Sesión
          </button>
          <button onClick={onExit} style={{ padding: '0.5rem 1rem', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', cursor: 'pointer' }}>
            Ver Mapa
          </button>
        </div>
      </header>

      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#0f161e', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3>No hay solicitudes pendientes</h3>
          <p style={{ color: 'var(--muted)' }}>Todas las instituciones han sido revisadas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {solicitudes.map(s => (
            <div key={s.id} style={{ background: '#0f161e', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--oro)' }}>{s.nombre}</h3>
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'rgba(0,191,255,0.1)', color: 'var(--cian)', borderRadius: '12px' }}>{s.tipo_actor}</span>
              </div>
              
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                <div>📍 {s.region} | Cadena: {s.cadena}</div>
                <div>🌐 {s.web}</div>
                <div>📞 {s.contacto}</div>
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                  {s.descripcion}
                </div>
                {s.servicios && <div style={{ fontSize: '0.8rem', color: '#fff', marginTop: '0.5rem' }}>Servicios: {s.servicios}</div>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => updateEstado(s.id, 'aprobado')}
                  style={{ flex: 1, padding: '0.6rem', background: 'rgba(76,209,55,0.15)', color: 'var(--verde-claro)', border: '1px solid rgba(76,209,55,0.3)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ✓ Aprobar
                </button>
                <button 
                  onClick={() => updateEstado(s.id, 'rechazado')}
                  style={{ flex: 1, padding: '0.6rem', background: 'rgba(255,71,87,0.1)', color: '#ff4757', border: '1px solid rgba(255,71,87,0.3)', borderRadius: '4px', cursor: 'pointer' }}>
                  ✕ Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
