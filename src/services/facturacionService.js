import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axiosClient from '../api/axiosClient';

/**
 * Servicio de Facturación y Generación de PDF conectado a la BD MySQL / NestJS
 */
export const facturacionService = {
  // Consultar factura y detalle_venta desde la BD por ID de venta
  obtenerFacturaPorVentaId: async (ventaId) => {
    const res = await axiosClient.get(`/facturacion/${ventaId}`);
    return res.data;
  },

  // Registrar nueva venta en la base de datos a través de NestJS (POST /ventas)
  registrarVenta: async (ventaDto) => {
    const res = await axiosClient.post('/ventas', ventaDto);
    return res.data;
  },

  // Listar ventas de la BD
  obtenerVentas: async (page = 1, limit = 100) => {
    const res = await axiosClient.get('/ventas', { params: { page, limit } });
    return res.data;
  },

  // Generar y descargar PDF tipo ticket de 80mm
  generarTicketPDF: (data) => {
    if (!data) throw new Error('No hay datos para generar la factura');

    const enc = data.encabezado || {};
    const nroFactura = enc.nro_factura || data.numeroFactura || `FAC-${String(data.id || '1').padStart(6, '0')}`;
    const fecha = enc.fecha ? new Date(enc.fecha).toLocaleDateString('es-CO') : new Date().toLocaleDateString('es-CO');
    const hora = enc.fecha ? new Date(enc.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '';
    
    // Normalizar Cajero
    let cajero = 'Cajero POS';
    const rawCajero = enc.cajero || data.cajero;
    if (typeof rawCajero === 'string' && rawCajero.trim()) {
      cajero = rawCajero.trim();
    } else if (rawCajero && typeof rawCajero === 'object') {
      cajero = rawCajero.nombre || rawCajero.name || rawCajero.email || 'Cajero POS';
    }

    // Extraer Cédula o NIT del cliente (en vez del nombre)
    let clienteDocFinal = '';
    const rawCliente = enc.cliente || data.cliente;

    if (typeof rawCliente === 'string' && rawCliente.trim() && !rawCliente.includes('[object Object]')) {
      clienteDocFinal = rawCliente.trim();
    } else if (rawCliente && typeof rawCliente === 'object') {
      clienteDocFinal = rawCliente.documento || rawCliente.doc || rawCliente.cedula || rawCliente.nit || '';
    }

    if (!clienteDocFinal || clienteDocFinal.includes('[object Object]')) {
      clienteDocFinal = data.documento || enc.documento || data.clienteDoc || data.nit || data.cedula || '';
    }

    // Si viene como 'Consumidor Final' o no hay documento, usar el estándar DIAN
    if (!clienteDocFinal || clienteDocFinal === 'Consumidor Final') {
      clienteDocFinal = '222222222222';
    }

    // Normalizar items de detalle_venta
    const items = (data.items || data.detalles || data.productos || []).map((it) => ({
      nombre: it.producto?.nombre || it.producto || it.nombre || 'Producto',
      cantidad: Number(it.cantidad) || 1,
      precio: Number(it.precio_unitario || it.producto?.precio || it.precio || 0),
      total: Number(it.subtotal || it.total || 0),
    }));

    const total = Number(data.totales?.total || data.total || items.reduce((acc, i) => acc + i.total, 0));
    const metodoPago = data.pagos?.[0]?.metodo || data.metodoPago || data.metodo || 'EFECTIVO';

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
    doc.text(`Fecha: ${fecha} ${hora}`.trim(), 5, 31);
    doc.text(`Cajero: ${cajero}`, 5, 35);
    doc.text(`C.C. / NIT: ${clienteDocFinal}`, 5, 39);
    doc.text(`Pago: ${metodoPago}`, 5, 43);

    // Tabla de ítems desde detalle_venta
    const bodyRows = items.map((i) => [
      i.cantidad.toString(),
      i.nombre,
      `$${i.precio.toLocaleString('es-CO')}`,
      `$${i.total.toLocaleString('es-CO')}`,
    ]);

    autoTable(doc, {
      startY: 47,
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

    const finalY = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 75) + 4;

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

  // Genera reporte financiero diario en PDF
  generarReporteFinancieroDiarioPDF: (ventas = []) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const totalBruto = ventas.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const totalIva = Math.round(totalBruto * 0.19);
    const totalNeto = totalBruto - totalIva;
    const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

    // Título y membrete
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('TIENDA COMUNITARIA', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('Reporte Contable y Balance Diario de Ventas', 105, 28, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Generado el: ${fechaHoy} | Origen: Base de Datos MySQL`, 105, 34, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(14, 38, 196, 38);

    // Tarjetas de Resumen
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Resumen Financiero', 14, 46);

    const kpiRows = [
      ['Ventas Netas (Base Imponible)', `$${totalNeto.toLocaleString('es-CO')} COP`],
      ['IVA Recaudado (19%)', `$${totalIva.toLocaleString('es-CO')} COP`],
      ['Total Bruto Facturado', `$${totalBruto.toLocaleString('es-CO')} COP`],
      ['Total de Transacciones / Facturas', `${ventas.length} emitidas`],
    ];

    autoTable(doc, {
      startY: 50,
      head: [['Concepto Contable', 'Monto Acumulado']],
      body: kpiRows,
      theme: 'grid',
      headStyles: { fillColor: [67, 56, 202], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 62, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    const startVentasY = doc.lastAutoTable.finalY + 10;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Detalle de Comprobantes Emitidos', 14, startVentasY);

    const ventasRows = ventas.map((v) => {
      let docCliente = '222222222222';
      if (v.documento && typeof v.documento === 'string' && v.documento.trim()) {
        docCliente = v.documento.trim();
      } else if (typeof v.cliente === 'string' && v.cliente.trim() && !v.cliente.includes('[object Object]')) {
        docCliente = v.cliente.trim();
      } else if (v.cliente && typeof v.cliente === 'object') {
        docCliente = v.cliente.documento || v.cliente.cedula || v.cliente.nit || '222222222222';
      }
      if (docCliente === 'Consumidor Final') {
        docCliente = '222222222222';
      }

      let nomCajero = 'Cajero';
      if (typeof v.cajero === 'string' && v.cajero.trim()) {
        nomCajero = v.cajero.trim();
      } else if (v.cajero && typeof v.cajero === 'object') {
        nomCajero = v.cajero.nombre || v.cajero.name || 'Cajero';
      }

      return [
        `FAC-${String(v.id).padStart(6, '0')}`,
        v.fecha ? new Date(v.fecha).toLocaleDateString('es-CO') : 'Hoy',
        docCliente,
        nomCajero,
        v.metodo || 'EFECTIVO',
        `$${Number(v.total || 0).toLocaleString('es-CO')}`,
      ];
    });

    autoTable(doc, {
      startY: startVentasY + 4,
      head: [['Factura', 'Fecha', 'C.C. / NIT', 'Cajero', 'Método', 'Total']],
      body: ventasRows.length > 0 ? ventasRows : [['-', '-', 'Sin ventas registradas', '-', '-', '$0']],
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    doc.save(`Reporte_Diario_${new Date().toISOString().slice(0, 10)}.pdf`);
    return true;
  },

  // Consulta la BD y descarga directamente
  descargarFacturaAutomaticaBD: async (ventaId) => {
    const data = await facturacionService.obtenerFacturaPorVentaId(ventaId);
    return facturacionService.generarTicketPDF(data);
  },
};

export default facturacionService;
