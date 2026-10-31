import { format, parseISO } from 'date-fns';

export const agruparVentasPorDia = (ventas) => {
  const porDia = {};
  ventas.forEach((v) => {
    const dia = format(parseISO(v.fecha), 'yyyy-MM-dd');
    porDia[dia] = (porDia[dia] || 0) + v.total;
  });
  return Object.entries(porDia)
    .map(([fecha, total]) => ({ fecha, total }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
};

export const calcularTotalVentas = (ventas) =>
  ventas.reduce((acc, v) => acc + v.total, 0);

export const productoMasVendido = (ventas) => {
  const conteo = {};
  ventas.forEach((v) =>
    v.items.forEach((i) => {
      conteo[i.nombre] = (conteo[i.nombre] || 0) + i.cantidad;
    })
  );
  const entradas = Object.entries(conteo);
  if (entradas.length === 0) return null;
  const [nombre, cantidad] = entradas.reduce((max, act) => (act[1] > max[1] ? act : max));
  return { nombre, cantidad };
};