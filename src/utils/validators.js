export const validarEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const validarPassword = (password) =>
  typeof password === 'string' && password.length >= 6;

export const validarCampoRequerido = (valor) =>
  typeof valor === 'string' && valor.trim().length > 0;

export const validarMontoPositivo = (monto) => {
  const n = Number(monto);
  return Number.isFinite(n) && n > 0;
};