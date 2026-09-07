import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

export const usuariosService = {
  /**
   * Obtiene la lista real de usuarios desde la Base de Datos a través de NestJS
   */
  obtenerUsuarios: async () => {
    try {
      const response = await axiosClient.get(ENDPOINTS.USUARIOS.BASE);
      const data = response.data;

      // Extraer lista según el formato de retorno de NestJS (Array directo o wrapper data/usuarios)
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object') {
        if (Array.isArray(data.data)) return data.data;
        if (Array.isArray(data.usuarios)) return data.usuarios;
        if (Array.isArray(data.result)) return data.result;
      }
      return [];
    } catch (error) {
      console.error('Error al consultar usuarios en NestJS:', error);
      throw error;
    }
  },

  /**
   * Registra un nuevo usuario en la BD de NestJS
   * DTO: { nombre, correo, contraseña, id_rol, id_estado }
   */
  crearUsuario: async (nuevoUsuario) => {
    const payload = {
      nombre: nuevoUsuario.nombre.trim(),
      correo: nuevoUsuario.correo.trim(),
      contraseña: nuevoUsuario.contraseña,
      contrasena: nuevoUsuario.contraseña,
      email: nuevoUsuario.correo.trim(),
      password: nuevoUsuario.contraseña,
      id_rol: Number(nuevoUsuario.id_rol) || 5, // 1 = Admin, 5 = Cajero
      id_estado: Number(nuevoUsuario.id_estado) || 1, // 1 = Activo
    };

    const response = await axiosClient.post(ENDPOINTS.USUARIOS.BASE, payload);
    return response.data;
  },
};

export default usuariosService;
