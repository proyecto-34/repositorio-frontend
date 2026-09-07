import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axiosClient from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';

/**
 * Servicio de Facturación y Generación de Recibos en PDF
 */
export const facturacionService = {
  /**
   * Obtener datos de factura desde la API del backend NestJS
   */
  obtenerFacturaPorId: async (id) => {
    const response = await axiosClient.get(ENDPOINTS.FACTURACION.BY_ID(id));
    return response.data;
  },

  /**
   * Descargar PDF generado por el backend NestJS (si existe endpoint nativo)
   */
  descargarPdfBackend: async (id) => {
    const response = await axiosClient.get(ENDPOINTS.FACTURACION.DESCARGAR_PDF(id), {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Factura_${id}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Generar y descargar Ticket de Venta en formato PDF (Estilo Tirilla POS 80mm)
   * @param {Object} venta - Objeto con datos de la venta y productos
   */
  generarTicketPDF: (venta) => {
    const {
      numeroFactura = 'FAC-00101',
      fecha = new Date().toLocaleDateString('es-CO'),
      hora = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      cajero = 'David Martínez',
      cliente = { nombre: 'Cliente General', documento: '222222222' },
      productos = [
        { nombre: 'Leche Entera 1L', cantidad: 2, precio: 4200, total: 8400 },
        { nombre: 'Arroz Diana 1kg', cantidad: 1, precio: 4800, total: 4800 },
        { nombre: 'Huevos AA x Unidad', cantidad: 6, precio: 600, total: 3600 },
        { nombre: 'Aceite Vegetal 900ml', cantidad: 1, precio: 9500, total: 9500 },
      ],
      metodoPago = 'Efectivo',
      montoRecibido = 30000,
    } = venta || {};

    // Calcular subtotales
    const subtotal = productos.reduce((acc, item) => acc + (item.total || item.precio * item.cantidad), 0);
    const iva = Math.round(subtotal * 0.19);
    const totalPagar = subtotal;
    const cambio = Math.max(0, montoRecibido - totalPagar);

    // Formato tipo tirilla térmica de 80mm x 210mm
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 200],
    });

    let y = 10;

    // Encabezado del Comercio
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('TIENDA COMUNITARIA', 40, y, { align: 'center' });
    
    y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('NIT: 900.123.456-7', 40, y, { align: 'center' });
    y += 4;
    doc.text('Calle 45 # 12-34 - Tel: (601) 555-0199', 40, y, { align: 'center' });
    y += 4;
    doc.text('Bogotá D.C., Colombia', 40, y, { align: 'center' });

    // Separador
    y += 4;
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);
    doc.setLineDashPattern([], 0);

    // Datos del Ticket
    y += 4;
    doc.setFont('Helvetica', 'bold');
    doc.text(`FACTURA: #${numeroFactura}`, 5, y);
    y += 4;
    doc.setFont('Helvetica', 'normal');
    doc.text(`Fecha: ${fecha}   Hora: ${hora}`, 5, y);
    y += 4;
    doc.text(`Cajero: ${cajero}`, 5, y);
    y += 4;
    doc.text(`Cliente: ${cliente.nombre}`, 5, y);
    if (cliente.documento) {
      y += 4;
      doc.text(`Doc: ${cliente.documento}`, 5, y);
    }

    // Tabla de Ítems
    y += 3;
    const bodyRows = productos.map((prod) => [
      prod.cantidad.toString(),
      prod.nombre,
      `$${prod.precio.toLocaleString('es-CO')}`,
      `$${(prod.total || prod.precio * prod.cantidad).toLocaleString('es-CO')}`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Cant.', 'Descripción', 'Unit.', 'Total']],
      body: bodyRows,
      theme: 'plain',
      styles: {
        fontSize: 7.5,
        cellPadding: 1,
      },
      headStyles: {
        fontStyle: 'bold',
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 15, halign: 'right' },
        3: { cellWidth: 15, halign: 'right' },
      },
      margin: { left: 4, right: 4 },
    });

    y = doc.lastAutoTable.finalY + 3;

    // Separador
    doc.setLineDashPattern([1, 1], 0);
    doc.line(5, y, 75, y);
    doc.setLineDashPattern([], 0);

    // Desglose de Totales
    y += 4;
    doc.setFontSize(8);
    doc.text('SUBTOTAL:', 45, y);
    doc.text(`$${subtotal.toLocaleString('es-CO')}`, 75, y, { align: 'right' });

    y += 4;
    doc.text('IVA (19% inc.):', 45, y);
    doc.text(`$${iva.toLocaleString('es-CO')}`, 75, y, { align: 'right' });

    y += 5;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL A PAGAR:', 5, y);
    doc.text(`$${totalPagar.toLocaleString('es-CO')}`, 75, y, { align: 'right' });

    // Datos de Pago
    y += 5;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Método de Pago: ${metodoPago}`, 5, y);
    
    if (metodoPago.toLowerCase() === 'efectivo' && montoRecibido) {
      y += 4;
      doc.text(`Recibido: $${montoRecibido.toLocaleString('es-CO')}`, 5, y);
      y += 4;
      doc.setFont('Helvetica', 'bold');
      doc.text(`Cambio: $${cambio.toLocaleString('es-CO')}`, 5, y);
    }

    // Pie de Recibo
    y += 8;
    doc.setFont('Helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('¡Gracias por apoyar el comercio local!', 40, y, { align: 'center' });
    y += 4;
    doc.text('Conserve este comprobante para cambios o reclamos', 40, y, { align: 'center' });
    y += 4;
    doc.setFont('Helvetica', 'normal');
    doc.text('*** Régimen Simplificado ***', 40, y, { align: 'center' });

    // Descargar el archivo
    doc.save(`Factura_${numeroFactura}.pdf`);
    return true;
  },
};

export default facturacionService;
