import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  X, 
  CheckCircle2, 
  Receipt,
  User,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { facturacionService } from '../services/facturacionService';

export const FacturaModal = ({ isOpen, onClose }) => {
  const [numeroFactura, setNumeroFactura] = useState(`FAC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [cajero, setCajero] = useState('David Martínez');
  const [cliente, setCliente] = useState({
    nombre: 'Consumidor Final',
    documento: '222222222222',
  });
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState(30000);

  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Leche Entera 1L', cantidad: 2, precio: 4200 },
    { id: 2, nombre: 'Arroz Diana 1kg', cantidad: 1, precio: 4800 },
    { id: 3, nombre: 'Huevos AA x Unidad', cantidad: 6, precio: 600 },
    { id: 4, nombre: 'Aceite Vegetal 900ml', cantidad: 1, precio: 9500 },
  ]);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    cantidad: 1,
    precio: '',
  });

  if (!isOpen) return null;

  const handleAgregarProducto = (e) => {
    e.preventDefault();
    if (!nuevoProducto.nombre.trim() || !nuevoProducto.precio) {
      toast.error('Ingresa nombre y precio del producto');
      return;
    }
    const precioNum = Number(nuevoProducto.precio);
    const cantNum = Number(nuevoProducto.cantidad) || 1;

    setProductos([
      ...productos,
      {
        id: Date.now(),
        nombre: nuevoProducto.nombre.trim(),
        cantidad: cantNum,
        precio: precioNum,
        total: cantNum * precioNum,
      },
    ]);

    setNuevoProducto({ nombre: '', cantidad: 1, precio: '' });
    toast.success('Producto añadido');
  };

  const handleEliminarProducto = (id) => {
    setProductos(productos.filter((p) => p.id !== id));
  };

  // Cálculos financieros
  const subtotal = productos.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal;
  const cambio = Math.max(0, Number(montoRecibido) - total);

  const handleGenerarPDF = () => {
    if (productos.length === 0) {
      toast.error('Agrega al menos un producto a la factura');
      return;
    }

    try {
      facturacionService.generarTicketPDF({
        numeroFactura,
        cajero,
        cliente,
        productos,
        metodoPago,
        montoRecibido: Number(montoRecibido),
      });
      toast.success(`¡Factura #${numeroFactura} descargada con éxito!`);
    } catch {
      toast.error('Error al generar el PDF de la factura');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '16px',
        border: '1px solid #334155',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Cabecera del Modal */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={22} color="#38bdf8" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Generador de Factura / Ticket POS
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Datos generales */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '12px',
            borderRadius: '10px',
            border: '1px solid #334155'
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                N° Factura
              </label>
              <input
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Cliente
              </label>
              <input
                type="text"
                value={cliente.nombre}
                onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #475569', color: '#fff', padding: '6px 8px', borderRadius: '6px', fontSize: '0.85rem' }}
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
                <option value="Daviplata">Daviplata</option>
                <option value="Tarjeta Débito/Crédito">Tarjeta</option>
                <option value="Transferencia Bancaria">Transferencia</option>
              </select>
            </div>
          </div>

          {/* Formulario rápido para agregar ítem */}
          <form onSubmit={handleAgregarProducto} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Producto (ej: Pan Tajado)..."
              value={nuevoProducto.nombre}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, nombre: e.target.value })}
              style={{ flex: '2 1 180px', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}
            />
            <input
              type="number"
              min="1"
              placeholder="Cant."
              value={nuevoProducto.cantidad}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, cantidad: e.target.value })}
              style={{ width: '70px', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '0.85rem' }}
            />
            <input
              type="number"
              min="0"
              placeholder="Precio ($)"
              value={nuevoProducto.precio}
              onChange={(e) => setNuevoProducto({ ...nuevoProducto, precio: e.target.value })}
              style={{ width: '110px', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '8px', fontSize: '0.85rem' }}
            />
            <button
              type="submit"
              style={{
                background: '#38bdf8',
                border: 'none',
                color: '#0f172a',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.85rem'
              }}
            >
              <Plus size={16} /> Añadir
            </button>
          </form>

          {/* Tabla de Productos */}
          <div style={{ border: '1px solid #334155', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px' }}>Cant.</th>
                  <th style={{ padding: '8px 12px' }}>Descripción</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unitario</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {productos.map((prod) => (
                  <tr key={prod.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: '8px 12px' }}>{prod.cantidad}</td>
                    <td style={{ padding: '8px 12px' }}>{prod.nombre}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>${prod.precio.toLocaleString('es-CO')}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: '#38bdf8' }}>
                      ${(prod.precio * prod.cantidad).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleEliminarProducto(prod.id)}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
                        title="Eliminar producto"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resumen Financiero */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#0f172a',
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid #334155'
          }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.8rem' }}>Subtotal: ${subtotal.toLocaleString('es-CO')}</p>
              <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '0.8rem' }}>IVA 19% (incluido): ${iva.toLocaleString('es-CO')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>TOTAL A PAGAR</span>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#4ade80', fontWeight: 800 }}>
                ${total.toLocaleString('es-CO')}
              </h3>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.5)'
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#f8fafc',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleGenerarPDF}
            style={{
              background: '#38bdf8',
              border: 'none',
              color: '#0f172a',
              padding: '8px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Download size={16} /> Descargar Factura en PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacturaModal;
