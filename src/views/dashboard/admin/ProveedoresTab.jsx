import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, Truck, Phone, MapPin, Building2 } from 'lucide-react';
import proveedoresService from '../../../services/proveedoresService';

export const ProveedoresTab = ({
  proveedores = [],
  cargando = false,
  onRecargar,
  onAbrirNuevaCompraConProveedor,
  canManage = true,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario con los campos exactos de la BD: nombre, contacto, direccion
  const [formProveedor, setFormProveedor] = useState({
    nombre: '',
    contacto: '',
    direccion: '',
  });

  const proveedoresFiltrados = proveedores.filter((p) => {
    const q = busqueda.toLowerCase();
    return (
      (p.nombre && p.nombre.toLowerCase().includes(q)) ||
      (p.contacto && String(p.contacto).toLowerCase().includes(q)) ||
      (p.direccion && p.direccion.toLowerCase().includes(q)) ||
      (p.id && String(p.id).includes(q))
    );
  });

  const handleAbrirNuevo = () => {
    setFormProveedor({
      nombre: '',
      contacto: '',
      direccion: '',
    });
    setModalNuevo(true);
  };

  const handleAbrirEditar = (p) => {
    setProveedorEditando(p);
    setFormProveedor({
      nombre: p.nombre || '',
      contacto: p.contacto || '',
      direccion: p.direccion || '',
    });
    setModalEditar(true);
  };

  const handleGuardarNuevo = async (e) => {
    e.preventDefault();
    if (!formProveedor.nombre.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }

    setGuardando(true);
    try {
      await proveedoresService.crearProveedor(formProveedor);
      toast.success(`Proveedor "${formProveedor.nombre}" registrado exitosamente en la BD`);
      setModalNuevo(false);
      if (onRecargar) onRecargar();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al registrar el proveedor';
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!proveedorEditando) return;

    setGuardando(true);
    try {
      await proveedoresService.actualizarProveedor(proveedorEditando.id, formProveedor);
      toast.success(`Proveedor "${formProveedor.nombre}" actualizado exitosamente`);
      setModalEditar(false);
      setProveedorEditando(null);
      if (onRecargar) onRecargar();
    } catch (err) {
      toast.error('Error al actualizar el proveedor');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (!window.confirm(`¿Estás seguro de eliminar el proveedor "${nombre}"?`)) return;

    try {
      await proveedoresService.eliminarProveedor(id);
      toast.success(`Proveedor "${nombre}" eliminado`);
      if (onRecargar) onRecargar();
    } catch (err) {
      toast.error('Error al eliminar proveedor');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Cabecera del Módulo */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '16px',
          padding: '1.4rem 1.6rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
            <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
              Directorio de Proveedores
            </h2>
          </div>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Proveedores y contactos registrados en la base de datos (tienda_comunitaria.proveedores)
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleAbrirNuevo}
            style={{
              background: '#38bdf8',
              color: '#0b0f19',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <Plus size={16} />
            Nuevo Proveedor
          </button>
        )}
      </div>

      {/* Barra de Búsqueda */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '14px',
          padding: '1rem 1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '450px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Buscar por nombre, contacto o dirección..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              background: '#0b0f19',
              border: 'none',
              color: '#f8fafc',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '0.88rem',
              outline: 'none',
            }}
          />
        </div>

        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Total proveedores: <strong style={{ color: '#38bdf8' }}>{proveedores.length}</strong>
        </span>
      </div>

      {/* Tabla de Proveedores (id, nombre, contacto, direccion) */}
      <div
        style={{
          background: '#151c2c',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e273d', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '14px 16px', fontWeight: 700, width: '70px' }}># ID</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Nombre</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Contacto</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>Dirección</th>
                {canManage && <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'center' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    Cargando proveedores desde la base de datos...
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#94a3b8' }}>
                    No se encontraron proveedores.
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                  >
                    <td style={{ padding: '14px 16px', color: '#38bdf8', fontWeight: 800 }}>
                      #{p.id}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={16} />
                        </div>
                        <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>
                          {p.nombre}
                        </strong>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: '#cbd5e1', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} color="#38bdf8" /> {p.contacto || 'Sin contacto'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} color="#f59e0b" /> {p.direccion || 'Sin dirección'}
                      </span>
                    </td>

                    {canManage && (
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          {onAbrirNuevaCompraConProveedor && (
                            <button
                              type="button"
                              onClick={() => onAbrirNuevaCompraConProveedor(p)}
                              title="Registrar Compra a este Proveedor"
                              style={{
                                background: 'rgba(34, 197, 94, 0.15)',
                                color: '#4ade80',
                                border: 'none',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <Truck size={13} /> Compra
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleAbrirEditar(p)}
                            title="Editar Proveedor"
                            style={{
                              background: 'rgba(139, 92, 246, 0.15)',
                              color: '#c4b5fd',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEliminar(p.id, p.nombre)}
                            title="Eliminar Proveedor"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#f87171',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Nuevo Proveedor (nombre, contacto, direccion) */}
      {modalNuevo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#151c2c',
              border: 'none',
              borderRadius: '18px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '480px',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={22} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Registrar Proveedor</h3>
              </div>
              <button
                onClick={() => setModalNuevo(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarNuevo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora S.A."
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Contacto (Teléfono / Celular)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 3001234567"
                  value={formProveedor.contacto}
                  onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                  style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Ej. Calle 123 #45-67"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                  style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{ background: '#38bdf8', color: '#0b0f19', border: 'none', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem' }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Proveedor */}
      {modalEditar && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 15, 25, 0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#151c2c',
              border: 'none',
              borderRadius: '18px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '480px',
              color: '#f8fafc',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={20} color="#c4b5fd" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Editar Proveedor</h3>
              </div>
              <button
                onClick={() => setModalEditar(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Contacto (Teléfono / Celular)
                </label>
                <input
                  type="text"
                  value={formProveedor.contacto}
                  onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                  style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                  style={{ width: '100%', background: '#0b0f19', border: 'none', color: '#fff', padding: '10px 14px', borderRadius: '10px', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  style={{ background: '#1e273d', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProveedoresTab;
