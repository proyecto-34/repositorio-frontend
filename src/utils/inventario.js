export const esStockBajo = (producto) =>
  Number(producto.stock) <= Number(producto.stockMinimo);

export const filtrarProductos = (productos, busqueda) => {
  const termino = (busqueda || '').trim().toLowerCase();
  if (!termino) return productos;
  return productos.filter((p) => p.nombre.toLowerCase().includes(termino));
};

export const calcularValorInventario = (productos) =>
  productos.reduce((acc, p) => acc + p.stock * p.precio, 0);