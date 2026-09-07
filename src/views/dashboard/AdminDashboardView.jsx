import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Search, 
  CheckCircle, 
  XCircle, 
  Plus, 
  X,
  DollarSign,
  Receipt,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { usuariosService } from '../../services/usuariosService';
import WeatherWidget from '../../components/WeatherWidget';

export const AdminDashboardView = ({ user, onOpenFactura, onAbrirPos }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    rol: 'cajero',
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    const data = await usuariosService.obtenerUsuarios();
    setUsuarios(data);
    setCargando(false);
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.nombre || !nuevoUsuario.correo || !nuevoUsuario.contraseña) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    const creado = await usuariosService.crearUsuario(nuevoUsuario);
    setUsuarios([...usuarios, creado]);
    setModalNuevoUsuario(false);
    setNuevoUsuario({ nombre: '', correo: '', contraseña: '', rol: 'cajero' });
    toast.success(`Usuario ${creado.nombre} (${creado.rol}) creado exitosamente`);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.toLowerCase();
    return (
      (u.nombre && u.nombre.toLowerCase().includes(q)) ||
      (u.correo && u.correo.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{
      maxWidth: '1300px',
      width: '100%',
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Tarjetas de Métricas Globales (KPIs) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Ventas del Día</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#34d399', fontWeight: 800 }}>
              $384,500
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>+12% vs ayer</span>
          </div>
          <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '10px', borderRadius: '10px', color: '#34d399' }}>
            <TrendingUp size={24} />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Usuarios / Personal</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#818cf8', fontWeight: 800 }}>
              {usuarios.length}
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Admin & Cajeros</span>
          </div>
          <div style={{ background: 'rgba(129, 140, 248, 0.1)', padding: '10px', borderRadius: '10px', color: '#818cf8' }}>
            <Users size={24} />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Stock de Productos</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#38bdf8', fontWeight: 800 }}>
              148
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>10 categorías</span>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '10px', borderRadius: '10px', color: '#38bdf8' }}>
            <Package size={24} />
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid #334155',
          borderRadius: '14px',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Alertas de Stock</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.5rem', color: '#f59e0b', fontWeight: 800 }}>
              3
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Reposición urgente</span>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', color: '#f59e0b' }}>
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Sección Principal: Gestión de Usuarios y Accesos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)',
        gap: '1.5rem',
        alignItems: 'start'
      }}>
        {/* Tabla de Usuarios */}
        <div style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="#818cf8" /> Gestión de Usuarios y Cajeros
              </h3>
              <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>
                Control de acceso RBAC vinculado a la API de NestJS
              </p>
            </div>

            <button
              onClick={() => setModalNuevoUsuario(true)}
              style={{
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '7px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserPlus size={16} /> Nuevo Usuario
            </button>
          </div>

          {/* Buscador de usuarios */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#0f172a',
            border: '1px solid #475569',
            borderRadius: '8px',
            padding: '0 12px',
            gap: '8px'
          }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Buscar usuario por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                padding: '8px 0',
                width: '100%',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Tabla */}
          <div style={{ border: '1px solid #334155', borderRadius: '10px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Usuario</th>
                  <th style={{ padding: '10px 12px' }}>Correo</th>
                  <th style={{ padding: '10px 12px' }}>Rol</th>
                  <th style={{ padding: '10px 12px' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => {
                  const rolStr = String(u.rol || u.role || 'cajero').toLowerCase();
                  const isAdminRol = rolStr.includes('admin');
                  return (
                    <tr key={u.id} style={{ borderTop: '1px solid #334155' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#f8fafc' }}>
                        {u.nombre || u.email || 'Sin nombre'}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#94a3b8' }}>
                        {u.correo || u.email}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          background: isAdminRol ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isAdminRol ? '#a5b4fc' : '#6ee7b7',
                          border: `1px solid ${isAdminRol ? 'rgba(99, 102, 241, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {isAdminRol ? '👑 Administrador' : '🛒 Cajero POS'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          color: u.estado === 'Inactivo' ? '#f87171' : '#4ade80',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {u.estado === 'Inactivo' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                          {u.estado || 'Activo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna Derecha: Clima & Atajos Rápidos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <WeatherWidget />

          <div style={{
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#f8fafc', fontWeight: 700 }}>
              ⚡ Acciones Rápidas del Admin
            </h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>
              Como administrador puedes acceder al Punto de Venta o emitir facturas en cualquier momento.
            </p>

            <button
              onClick={onOpenFactura}
              style={{
                background: '#059669',
                color: '#fff',
                border: 'none',
                padding: '9px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Receipt size={16} /> Emitir Factura Manual PDF
            </button>
          </div>
        </div>
      </div>

      {/* Modal para Crear Nuevo Usuario */}
      {modalNuevoUsuario && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            borderRadius: '16px',
            border: '1px solid #334155',
            width: '100%',
            maxWidth: '440px',
            padding: '1.5rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#818cf8" /> Registrar Usuario
              </h3>
              <button
                onClick={() => setModalNuevoUsuario(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Ej: Andrés Morales"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  placeholder="cajero@tienda.com"
                  value={nuevoUsuario.correo}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Contraseña Temporal
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={nuevoUsuario.contraseña}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contraseña: e.target.value })}
                  required
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Rol Asignado
                </label>
                <select
                  value={nuevoUsuario.rol}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
                >
                  <option value="cajero">🛒 Cajero POS</option>
                  <option value="admin">👑 Administrador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalNuevoUsuario(false)}
                  style={{ background: '#334155', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardView;
