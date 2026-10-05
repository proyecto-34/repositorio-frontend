import React from 'react';
import { toast } from 'sonner';

export const DashboardKpis = ({
  tabActiva,
  setTabActiva,
  onSeleccionarFiltroStock,
  filtroStock = 'todos',
  canViewReports = true,
  canManageInventory = true,
  canManageSuppliers = true,
  canManageUsers = true,
  totalVentasBrutas = 0,
  ventasCount = 0,
  totalProductos = 0,
  cargandoProductos = false,
  valorTotalInventario = 0,
  productosBajoStock = 0,
  proveedoresCount = 0,
  proveedoresActivosCount = 0,
  cargandoProveedores = false,
  usuariosCount = 0,
  cargandoUsuarios = false,
  rolesCounts = { admins: 0, contadores: 0, supervisores: 0, cajeros: 0 },
}) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {/* KPI 1: Finanzas / Ventas */}
      {canViewReports && (
        <div
          onClick={() => setTabActiva('reportes')}
          style={{
            background: tabActiva === 'reportes' ? '#1e273d' : '#151c2c',
            borderRadius: '16px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            border: 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
            }}
          >
            Ingresos Totales (Ventas)
          </span>
          <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#22c55e', fontWeight: 800 }}>
            ${totalVentasBrutas.toLocaleString('es-CO')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#86efac' }}>
            {ventasCount} facturas emitidas
          </span>
        </div>
      )}

      {/* KPI 2: Inventario */}
      {canManageInventory && (
        <div
          onClick={() => {
            setTabActiva('inventario');
            if (onSeleccionarFiltroStock) onSeleccionarFiltroStock('todos');
          }}
          style={{
            background: tabActiva === 'inventario' && filtroStock === 'todos' ? '#1e273d' : '#151c2c',
            borderRadius: '16px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            border: 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
            }}
          >
            Catálogo de Productos
          </span>
          <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#8b5cf6', fontWeight: 800 }}>
            {cargandoProductos ? '...' : totalProductos}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
            Valor: ${valorTotalInventario.toLocaleString('es-CO')}
          </span>
        </div>
      )}

      {/* KPI 3: Alertas de Stock */}
      {canManageInventory && (
        <div
          onClick={() => {
            setTabActiva('inventario');
            if (productosBajoStock === 0) {
              if (onSeleccionarFiltroStock) onSeleccionarFiltroStock('todos');
              toast.info('¡Inventario en nivel óptimo! Todos los productos tienen existencias suficientes.');
            } else {
              const nuevoFiltro = (tabActiva === 'inventario' && filtroStock === 'bajo') ? 'todos' : 'bajo';
              if (onSeleccionarFiltroStock) onSeleccionarFiltroStock(nuevoFiltro);
              if (nuevoFiltro === 'bajo') {
                toast.warning(`Mostrando ${productosBajoStock} producto(s) con alerta de stock`);
              } else {
                toast.info('Mostrando catálogo completo de productos');
              }
            }
          }}
          style={{
            background: tabActiva === 'inventario' && filtroStock === 'bajo' ? '#271f38' : '#151c2c',
            border: tabActiva === 'inventario' && filtroStock === 'bajo' ? '1px solid #f59e0b' : 'none',
            borderRadius: '16px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
            }}
          >
            Alertas de Stock
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: '1.65rem',
              color: productosBajoStock > 0 ? '#f59e0b' : '#22c55e',
              fontWeight: 800,
            }}
          >
            {productosBajoStock}
          </h3>
          <span style={{ fontSize: '0.75rem', color: productosBajoStock > 0 ? '#fbbf24' : '#86efac' }}>
            {productosBajoStock > 0 ? `${productosBajoStock} requieren reposición` : 'Stock en nivel óptimo'}
          </span>
        </div>
      )}

      {/* KPI 4: Proveedores */}
      {canManageSuppliers && (
        <div
          onClick={() => setTabActiva('proveedores')}
          style={{
            background: tabActiva === 'proveedores' ? '#1e273d' : '#151c2c',
            borderRadius: '16px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            border: 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
            }}
          >
            Proveedores
          </span>
          <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#38bdf8', fontWeight: 800 }}>
            {cargandoProveedores ? '...' : proveedoresCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#7dd3fc' }}>
            {proveedoresActivosCount} aliados activos
          </span>
        </div>
      )}

      {/* KPI 5: Usuarios */}
      {canManageUsers && (
        <div
          onClick={() => setTabActiva('usuarios')}
          style={{
            background: tabActiva === 'usuarios' ? '#1e273d' : '#151c2c',
            borderRadius: '16px',
            padding: '1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            border: 'none',
          }}
        >
          <span
            style={{
              fontSize: '0.78rem',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 600,
            }}
          >
            Usuarios en BD
          </span>
          <h3 style={{ margin: 0, fontSize: '1.65rem', color: '#c4b5fd', fontWeight: 800 }}>
            {cargandoUsuarios ? '...' : usuariosCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Admin: {rolesCounts.admins} &middot; Cajero: {rolesCounts.cajeros} &middot; Supervisor:{' '}
            {rolesCounts.supervisores} &middot; Contador: {rolesCounts.contadores}
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardKpis;
