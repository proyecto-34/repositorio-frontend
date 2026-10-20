import React, { useState } from 'react';
import { toast } from 'sonner';
import { usuariosService } from '../../../services/usuariosService';
import { ROLES_DB, obtenerInfoRol } from '../../../constants/roles';
import Can from '../../../components/Can';
import useConfirm from '../../../hooks/useConfirm';

export const UsuariosTab = ({
  usuarios = [],
  cargando = false,
  onRecargar,
}) => {
  const { confirm, ConfirmDialog } = useConfirm();
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    correo: '',
    contraseña: '',
    id_rol: 2,
    id_estado: 1,
  });

  const handleAbrirCrear = () => {
    setUsuarioEditando(null);
    setFormUsuario({
      nombre: '',
      correo: '',
      contraseña: '',
      id_rol: 2,
      id_estado: 1,
    });
    setModalAbierto(true);
  };

  const handleAbrirEditar = (u) => {
    setUsuarioEditando(u);
    setFormUsuario({
      nombre: u.nombre || '',
      correo: u.correo || u.email || '',
      contraseña: '',
      id_rol: Number(u.id_rol ?? u.rol?.id ?? 2),
      id_estado: Number(u.id_estado ?? u.estado?.id ?? 1),
    });
    setModalAbierto(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formUsuario.nombre || !formUsuario.correo) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    if (!usuarioEditando && !formUsuario.contraseña) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    setGuardando(true);
    try {
      if (usuarioEditando) {
        await usuariosService.actualizarUsuario(usuarioEditando.id, formUsuario);
        toast.success(`Usuario "${formUsuario.nombre}" actualizado correctamente en la BD`);
      } else {
        await usuariosService.crearUsuario(formUsuario);
        toast.success(`Usuario "${formUsuario.nombre}" registrado exitosamente en la BD`);
      }

      if (onRecargar) await onRecargar();
      setModalAbierto(false);
      setUsuarioEditando(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al guardar el usuario en la BD';
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    const ok = await confirm({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar o desactivar al usuario "${nombre}"?`,
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;

    try {
      await usuariosService.eliminarUsuario(id);
      toast.success(`Usuario "${nombre}" eliminado`);
      if (onRecargar) await onRecargar();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error al eliminar usuario en la BD';
      toast.error(`Error: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busquedaUsuarios.toLowerCase();
    return (
      (u.nombre && u.nombre.toLowerCase().includes(q)) ||
      (u.correo && u.correo.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ width: '100%' }}>
      {/* Contenedor de la Tabla de Usuarios */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderRadius: '18px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
              Usuarios Registrados en la Base de Datos
            </h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Gestión y roles de usuarios ({usuarios.length} registros)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onRecargar}
              disabled={cargando}
              style={{
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-secondary)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                cursor: cargando ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.82rem',
              }}
            >
              {cargando ? 'Cargando...' : 'Recargar'}
            </button>

            <Can roles={['admin', 'supervisor']}>
              <button
                type="button"
                onClick={handleAbrirCrear}
                style={{
                  background: '#1e5bb8',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                }}
              >
                + Nuevo Usuario
              </button>
            </Can>
          </div>
        </div>

        {/* Buscador */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '0 14px', border: '1px solid var(--border-input)' }}>
          <input
            type="text"
            placeholder="Buscar usuario por nombre o correo..."
            value={busquedaUsuarios}
            onChange={(e) => setBusquedaUsuarios(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              padding: '10px 0',
              width: '100%',
              outline: 'none',
              fontSize: '0.88rem',
            }}
          />
        </div>

        {/* Tabla de Usuarios */}
        <div style={{ borderRadius: '12px', overflowX: 'auto', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Nombre</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Correo Electrónico</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Rol</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Estado</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--accent-primary)' }}>
                    Consultando usuarios en la base de datos...
                  </td>
                </tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((u, idx) => {
                  const idRolNum = Number(u.id_rol ?? u.rol?.id ?? (typeof u.rol === 'number' ? u.rol : 2));
                  const idEstadoNum = Number(u.id_estado ?? u.estado?.id ?? (typeof u.estado === 'number' ? u.estado : 1));
                  const infoRol = obtenerInfoRol(idRolNum);

                  return (
                    <tr
                      key={u.id || u.correo}
                      style={{
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-subtle)',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {u.nombre || u.email || 'Sin nombre'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                        <span
                          style={{
                            color: 'var(--accent-primary)',
                            background: 'var(--accent-primary-subtle)',
                            border: '1px solid var(--accent-primary-border)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontFamily: 'monospace',
                            fontSize: '0.82rem',
                          }}
                        >
                          {u.correo || u.email}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            color: 'var(--accent-primary)',
                            border: '1px solid var(--border-color)',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            letterSpacing: '0.3px',
                          }}
                        >
                          {infoRol.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: idEstadoNum === 1 ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
                            color: idEstadoNum === 1 ? 'var(--color-success)' : 'var(--color-danger)',
                            border: `1px solid ${idEstadoNum === 1 ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
                            padding: '3px 9px',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {idEstadoNum === 1 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <Can do="edit" on="usuarios">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditar(u)}
                              style={{
                                background: 'var(--bg-subtle)',
                                color: 'var(--accent-primary)',
                                border: '1px solid var(--border-input)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              Editar
                            </button>
                          </Can>
                          <Can do="delete" on="usuarios">
                            <button
                              type="button"
                              onClick={() => handleEliminar(u.id, u.nombre)}
                              style={{
                                background: 'var(--color-danger-subtle)',
                                color: 'var(--color-danger)',
                                border: '1px solid var(--color-danger-border)',
                                padding: '6px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              Eliminar
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL UNIFICADO: Crear / Editar Usuario */}
      {modalAbierto && (
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
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: 'none',
              borderRadius: '18px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '460px',
              color: 'var(--text-primary)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.12)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.4rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                  {usuarioEditando ? `Editar Usuario #${usuarioEditando.id}` : 'Registrar Usuario en BD'}
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {usuarioEditando ? 'Modificar rol, estado o datos' : 'tienda_comunitaria.usuarios'}
                </span>
              </div>
              <button
                onClick={() => setModalAbierto(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Mendoza"
                  value={formUsuario.nombre}
                  onChange={(e) => setFormUsuario({ ...formUsuario, nombre: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  placeholder="usuario@gmail.com"
                  value={formUsuario.correo}
                  onChange={(e) => setFormUsuario({ ...formUsuario, correo: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                  Contraseña {usuarioEditando ? '(Opcional al editar)' : '*'}
                </label>
                <input
                  type="password"
                  placeholder={usuarioEditando ? 'Dejar en blanco para mantener la actual' : '••••••••'}
                  value={formUsuario.contraseña}
                  onChange={(e) => setFormUsuario({ ...formUsuario, contraseña: e.target.value })}
                  required={!usuarioEditando}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-input)',
                    color: 'var(--text-primary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Rol
                  </label>
                  <select
                    value={formUsuario.id_rol}
                    onChange={(e) => setFormUsuario({ ...formUsuario, id_rol: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-input)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    {ROLES_DB.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                    Estado
                  </label>
                  <select
                    value={formUsuario.id_estado}
                    onChange={(e) => setFormUsuario({ ...formUsuario, id_estado: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-input)',
                      color: 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  >
                    <option value={1}>Activo</option>
                    <option value={2}>Inactivo</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  style={{
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-input)',
                    padding: '9px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    background: '#1e5bb8',
                    color: '#fff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '10px',
                    cursor: guardando ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {guardando
                    ? 'Guardando...'
                    : usuarioEditando
                    ? 'Guardar Cambios'
                    : 'Guardar en BD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo Moderno de Confirmación */}
      <ConfirmDialog />
    </div>
  );
};

export default UsuariosTab;
