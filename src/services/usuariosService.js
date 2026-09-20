import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Catálogo de respaldo exacto según la tabla tienda_comunitaria.usuarios:
 * Columnas: id, nombre, correo, contraseña, id_rol, id_estado
 */
export const USUARIOS_DEFAULT = [
  { id: 1, nombre: 'Johan', correo: 'johanarteaga215@gmail.com', id_rol: 1, id_estado: 1 },
  { id: 2, nombre: 'Danna', correo: 'Dannaarteaga@gmail.com', id_rol: 5, id_estado: 1 },
  { id: 3, nombre: 'carlos', correo: 'carlos@gmail.com', id_rol: 5, id_estado: 1 },
  { id: 4, nombre: 'luisa', correo: 'luisaT@gmail.com', id_rol: 5, id_estado: 1 },
  { id: 5, nombre: 'David', correo: 'davidzambrano@gmail.com', id_rol: 5, id_estado: 1 },
  { id: 6, nombre: 'luis', correo: 'luis@gmail.com', id_rol: 5, id_estado: 1 },
  { id: 7, nombre: 'karla', correo: 'karla@gmail.com', id_rol: 5, id_estado: 1 },
  { id: 8, nombre: 'lucas', correo: 'lucas@gmail.com', id_rol: 5, id_estado: 1 },
];

export const usuariosService = {
  /**
   * Obtiene la lista real de usuarios desde la Base de Datos a través de NestJS
   */
  obtenerUsuarios: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.USUARIOS.BASE);
      const data = response.data;

      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.usuarios)) return data.usuarios;
        if (Array.isArray(data.result)) return data.result;
      }
      return USUARIOS_DEFAULT;
    } catch (error) {
      console.warn('Usando lista de respaldo de usuarios:', error.message);
      return USUARIOS_DEFAULT;
    }
  },

  /**
   * Registra un nuevo usuario en la BD de NestJS
   * DTO: { nombre, correo, contraseña, id_rol, id_estado }
   */
  crearUsuario: async (nuevoUsuario) => {
    const payload = {
      nombre: (nuevoUsuario.nombre || '').trim(),
      correo: (nuevoUsuario.correo || nuevoUsuario.email || '').trim(),
      email: (nuevoUsuario.correo || nuevoUsuario.email || '').trim(),
      contraseña: nuevoUsuario.contraseña || nuevoUsuario.password,
      contrasena: nuevoUsuario.contraseña || nuevoUsuario.password,
      password: nuevoUsuario.contraseña || nuevoUsuario.password,
      id_rol: Number(nuevoUsuario.id_rol) || 5, // 1: ADMIN, 2: CONTADOR, 3: INVENTARIO, 4: SUPERVISOR, 5: CAJERO
      id_estado: Number(nuevoUsuario.id_estado) || 1, // 1: ACTIVO, 2: INACTIVO
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.USUARIOS.BASE, payload);
      return response.data;
    } catch (error) {
      console.error('Error al registrar usuario en NestJS:', error);
      throw error;
    }
  },

  /**
   * Actualiza rol o estado de un usuario
   */
  actualizarUsuario: async (id, datos) => {
    const payload = {
      nombre: datos.nombre?.trim(),
      correo: (datos.correo || datos.email)?.trim(),
      email: (datos.correo || datos.email)?.trim(),
      id_rol: datos.id_rol !== undefined ? Number(datos.id_rol) : undefined,
      id_estado: datos.id_estado !== undefined ? Number(datos.id_estado) : undefined,
    };
    if (datos.contraseña) {
      payload.contraseña = datos.contraseña;
      payload.password = datos.contraseña;
    }

    try {
      const response = await axiosClient.put(ENDPOINTS.USUARIOS.BY_ID(id), payload);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar usuario ${id}:`, error);
      throw error;
    }
  },

  /**
   * Elimina un usuario de la BD
   */
  eliminarUsuario: async (id) => {
    try {
      const response = await axiosClient.delete(ENDPOINTS.USUARIOS.BY_ID(id));
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar usuario ${id}:`, error);
      throw error;
    }
  },
};

export default usuariosService;
