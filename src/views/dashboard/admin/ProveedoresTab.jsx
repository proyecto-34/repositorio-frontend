import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Search, Truck, Phone, MapPin, Building2 } from 'lucide-react';
import proveedoresService from '../../../services/proveedoresService';
import Can from '../../../components/Can';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%' }}>
      {/* Cabecera del Módulo con Barra de Búsqueda Integrada */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          padding: '1.6rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.4rem',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                Directorio de Proveedores
              </h2>
            </div>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Gestión de proveedores comerciales, datos de contacto y emisión de órdenes de compra
            </p>
          </div>

          <Can do="create" on="proveedores">
            <button
              type="button"
              onClick={handleAbrirNuevo}
              style={{
                background: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 3px 10px rgba(30, 91, 184, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={18} />
              Nuevo Proveedor
            </button>
          </Can>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div
          style={{
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flex: 1,
              maxWidth: '500px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-input)',
              borderRadius: '10px',
              padding: '0 14px',
            }}
          >
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '11px 0',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-subtle)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
            }}
          >
            Proveedores encontrados: <strong style={{ color: 'var(--accent-primary)' }}>{proveedoresFiltrados.length}</strong> de {proveedores.length}
          </div>
        </div>
      </div>

      {/* Tabla de Proveedores */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.9rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '15px 20px', fontWeight: 700, width: '80px' }}># ID</th>
                <th style={{ padding: '15px 20px', fontWeight: 700 }}>Nombre</th>
                <th style={{ padding: '15px 20px', fontWeight: 700 }}>Contacto</th>
                <th style={{ padding: '15px 20px', fontWeight: 700 }}>Dirección</th>
                {canManage && <th style={{ padding: '15px 20px', fontWeight: 700, textAlign: 'center', width: '220px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Cargando proveedores desde la base de datos...
                  </td>
                </tr>
              ) : proveedoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                proveedoresFiltrados.map((p, idx) => (
                  <tr
                    key={p.id}
                    style={{
                      background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <td style={{ padding: '16px 20px', color: 'var(--accent-primary)', fontWeight: 800 }}>
                      #{p.id}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'var(--accent-primary-subtle)',
                            color: 'var(--accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={18} />
                        </div>
                        <strong style={{ color: 'var(--text-primary)', fontSize: '0.94rem' }}>
                          {p.nombre}
                        </strong>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={15} color="var(--accent-primary)" /> {p.contacto || 'Sin contacto'}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={15} color="#f59e0b" /> {p.direccion || 'Sin dirección'}
                      </span>
                    </td>

                    {canManage && (
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          {onAbrirNuevaCompraConProveedor && (
                            <Can do="create" on="compras">
                              <button
                                type="button"
                                onClick={() => onAbrirNuevaCompraConProveedor(p)}
                                title="Registrar Compra a este Proveedor"
                                style={{
                                  background: 'rgba(34, 197, 94, 0.12)',
                                  color: '#16a34a',
                                  border: '1px solid rgba(34, 197, 94, 0.3)',
                                  padding: '7px 12px',
                                  borderRadius: '9px',
                                  cursor: 'pointer',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Truck size={14} /> Compra
                              </button>
                            </Can>
                          )}

                          <Can do="edit" on="proveedores">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(p)}
                              title="Editar Proveedor"
                              style={{
                                background: 'var(--accent-primary-subtle)',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--accent-primary-border)',
                                padding: '7px 11px',
                                borderRadius: '9px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                          </Can>

                          <Can do="delete" on="proveedores">
                            <button
                              type="button"
                              onClick={() => handleEliminar(p.id, p.nombre)}
                              title="Eliminar Proveedor"
                              style={{
                                background: 'var(--color-danger-subtle)',
                                color: 'var(--color-danger)',
                                border: '1px solid var(--color-danger-border)',
                                padding: '7px 11px',
                                borderRadius: '9px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </Can>
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

      {/* MODAL: Nuevo Proveedor */}
      {modalNuevo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-modal-overlay)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '2.2rem',
              width: '100%',
              maxWidth: '520px',
              color: 'var(--text-primary)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Building2 size={24} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Registrar Proveedor</h3>
              </div>
              <button
                onClick={() => setModalNuevo(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarNuevo} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div>
                <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Central S.A.S."
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Contacto (Teléfono / Celular)
                </label>
                <input
                  type="text"
                  placeholder="Ej. 3001234567"
                  value={formProveedor.contacto}
                  onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Dirección
                </label>
                <input
                  type="text"
                  placeholder="Ej. Calle 45 #12-34, Bogotá"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '11px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{ background: 'var(--accent-primary)', color: '#ffffff', border: 'none', padding: '11px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem' }}
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
            backgroundColor: 'var(--bg-modal-overlay)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '2.2rem',
              width: '100%',
              maxWidth: '520px',
              color: 'var(--text-primary)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={22} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Editar Proveedor</h3>
              </div>
              <button
                onClick={() => setModalEditar(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              <div>
                <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Nombre del Proveedor *
                </label>
                <input
                  type="text"
                  required
                  value={formProveedor.nombre}
                  onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Contacto (Teléfono / Celular)
                </label>
                <input
                  type="text"
                  value={formProveedor.contacto}
                  onChange={(e) => setFormProveedor({ ...formProveedor, contacto: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                  Dirección
                </label>
                <input
                  type="text"
                  value={formProveedor.direccion}
                  onChange={(e) => setFormProveedor({ ...formProveedor, direccion: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-input)', color: 'var(--text-primary)', padding: '12px 16px', borderRadius: '10px', fontSize: '0.92rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalEditar(false)}
                  style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '11px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{ background: 'var(--accent-primary)', color: '#ffffff', border: 'none', padding: '11px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '0.88rem' }}
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
