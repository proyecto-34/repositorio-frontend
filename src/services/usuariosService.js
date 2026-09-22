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
      // Pasamos limit: 100 para que NestJS devuelva todos los registros
      const response = await axiosClient.get(ENDPOINTS.USUARIOS.BASE, {
        params: { limit: 100, page: 1 },
      });
      const data = response.data;
      let rawList = [];

      if (Array.isArray(data)) rawList = data;
      else if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) rawList = data.data;
        else if (Array.isArray(data.usuarios)) rawList = data.usuarios;
        else if (Array.isArray(data.result)) rawList = data.result;
      }

      if (rawList.length > 0) {
        return rawList.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          correo: u.correo || u.email,
          email: u.correo || u.email,
          // TypeORM devuelve rol: { id: 4, nombre: "..." } y estado: { id: 2, nombre: "..." }
          id_rol: Number(u.id_rol ?? u.rol?.id ?? u.rol?.id_rol ?? (typeof u.rol === 'number' ? u.rol : 5)),
          id_estado: Number(u.id_estado ?? u.estado?.id ?? u.estado?.id_estado ?? (typeof u.estado === 'number' ? u.estado : 1)),
          rol: u.rol,
          estado: u.estado,
        }));
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
      contraseña: nuevoUsuario.contraseña || nuevoUsuario.contrasena || nuevoUsuario.password,
      id_rol: Number(nuevoUsuario.id_rol) || 5, // 1: ADMIN, 2: CONTADOR, 3: INVENTARIO, 4: SUPERVISOR, 5: CAJERO
      id_estado: Number(nuevoUsuario.id_estado) || 1, // 1: ACTIVO, 2: INACTIVO
    };

    try {
      const response = await axiosClient.post(ENDPOINTS.USUARIOS.BASE, payload);
      return response.data;
    } catch (error) {
      // Si el DTO de NestJS no acepta la 'ñ' y pide 'contrasena' o 'password'
      if (error.response && error.response.status === 400) {
        try {
          const fallbackPayload = {
            ...payload,
            contrasena: payload.contraseña,
            password: payload.contraseña,
          };
          delete fallbackPayload.contraseña;
          const retryRes = await axiosClient.post(ENDPOINTS.USUARIOS.BASE, fallbackPayload);
          return retryRes.data;
        } catch (retryErr) {
          throw error;
        }
      }
      console.error('Error al registrar usuario en NestJS:', error?.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Actualiza rol o estado de un usuario
   */
  /**
   * Actualiza rol, estado o datos de un usuario en NestJS
   * Mapeo exacto según tabla: { nombre, correo, contraseña, id_rol, id_estado }
   */
  actualizarUsuario: async (id, datos) => {
    // Payload limpio con nombres exactos de columnas de la BD
    const payload = {};
    if (datos.nombre) payload.nombre = datos.nombre.trim();
    if (datos.correo) payload.correo = datos.correo.trim();
    if (datos.id_rol !== undefined && datos.id_rol !== '') payload.id_rol = Number(datos.id_rol);
    if (datos.id_estado !== undefined && datos.id_estado !== '') payload.id_estado = Number(datos.id_estado);
    if (datos.contraseña && datos.contraseña.trim() !== '') {
      payload.contraseña = datos.contraseña;
    }

    try {
      // NestJS usa comúnmente @Patch(':id') para updates parciales
      const response = await axiosClient.patch(ENDPOINTS.USUARIOS.BY_ID(id), payload);
      return response.data;
    } catch (patchError) {
      // Si el backend fue configurado con @Put(':id')
      if (patchError.response && (patchError.response.status === 404 || patchError.response.status === 405)) {
        const putResponse = await axiosClient.put(ENDPOINTS.USUARIOS.BY_ID(id), payload);
        return putResponse.data;
      }
      console.error(`Error al actualizar usuario ${id} en NestJS:`, patchError?.response?.data || patchError.message);
      throw patchError;
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
