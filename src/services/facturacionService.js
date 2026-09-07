import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axiosClient from '../api/axiosClient';

/**
 * Servicio de Facturación y Generación de PDF conectado a la BD
 */
export const facturacionService = {
  // Consultar factura y detalle_venta desde la BD por ID de venta
  obtenerFacturaPorVentaId: async (ventaId) => {
    const res = await axiosClient.get(`/facturacion/${ventaId}`);
    return res.data;
  },

  // Listar ventas de la BD
  obtenerVentas: async (page = 1, limit = 50) => {
    const res = await axiosClient.get('/ventas', { params: { page, limit } });
    return res.data;
  },

  // Generar y descargar PDF tipo ticket de 80mm
  generarTicketPDF: (data) => {
    if (!data) throw new Error('No hay datos para generar la factura');

    const enc = data.encabezado || {};
    const nroFactura = enc.nro_factura || data.numeroFactura || `FAC-${data.id || '001'}`;
    const fecha = enc.fecha ? new Date(enc.fecha).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO');
    const hora = enc.fecha ? new Date(enc.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
    const cajero = enc.cajero || (typeof data.cajero === 'object' ? data.cajero?.nombre : data.cajero) || 'Cajero';
    const cliente = typeof enc.cliente === 'string' ? enc.cliente : (enc.cliente?.nombre || data.cliente || 'Consumidor Final');

    // Normalizar items de detalle_venta
    const items = (data.items || data.detalles || data.productos || []).map((it) => ({
      nombre: it.producto?.nombre || it.producto || it.nombre || 'Producto',
      cantidad: Number(it.cantidad) || 1,
      precio: Number(it.precio_unitario || it.producto?.precio || it.precio || 0),
      total: Number(it.subtotal || it.total || 0),
    }));

    const total = Number(data.totales?.total || data.total || items.reduce((acc, i) => acc + i.total, 0));

    // Crear PDF formato tirilla 80mm
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [80, 200] });

    // Encabezado
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TIENDA COMUNITARIA', 40, 10, { align: 'center' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('NIT: 900.123.456-7 - Tel: (601) 555-0199', 40, 15, { align: 'center' });
    doc.text('Mocoa, Putumayo, Colombia', 40, 19, { align: 'center' });

    // Línea divisoria
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, 22, 75, 22);

    // Datos del comprobante
    doc.setFont('Helvetica', 'bold');
    doc.text(`FACTURA: #${nroFactura}`, 5, 27);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Fecha: ${fecha} ${hora}`, 5, 31);
    doc.text(`Cajero: ${cajero}`, 5, 35);
    doc.text(`Cliente: ${cliente}`, 5, 39);

    // Tabla de ítems desde detalle_venta
    const bodyRows = items.map((i) => [
      i.cantidad.toString(),
      i.nombre,
      `$${i.precio.toLocaleString('es-CO')}`,
      `$${i.total.toLocaleString('es-CO')}`,
    ]);

    autoTable(doc, {
      startY: 43,
      head: [['Cant.', 'Descripción', 'Unit.', 'Total']],
      body: bodyRows,
      theme: 'plain',
      styles: { fontSize: 7.5, cellPadding: 1 },
      headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 15, halign: 'right' },
        3: { cellWidth: 15, halign: 'right' },
      },
      margin: { left: 4, right: 4 },
    });

    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 70) + 4;

    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, finalY, 75, finalY);

    // Total
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL A PAGAR:', 5, finalY + 6);
    doc.text(`$${total.toLocaleString('es-CO')}`, 75, finalY + 6, { align: 'right' });

    // Pie
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('¡Gracias por su compra!', 40, finalY + 14, { align: 'center' });

    // Guardar archivo
    doc.save(`Factura_${nroFactura}.pdf`);
    return true;
  },

  // Consulta la BD y descarga directamente
  descargarFacturaAutomaticaBD: async (ventaId) => {
    const data = await facturacionService.obtenerFacturaPorVentaId(ventaId);
    return facturacionService.generarTicketPDF(data);
  },
};

export default facturacionService;
