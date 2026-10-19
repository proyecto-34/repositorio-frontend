import React from 'react';
import { toast } from 'sonner';

export const DashboardKpis = ({
  tabActiva,
  setTabActiva,
  onSeleccionarFiltroStock,
  filtroStock = 'todos',
  canViewReports = true,
  canManageInventory = true,
  canViewInventory = true,
  canManageSuppliers = true,
  canViewSuppliers = true,
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
        gap: '1rem',
      }}
    >
      {/* KPI 1: Finanzas / Ventas */}
      {canViewReports && (
        <div
          onClick={() => setTabActiva('reportes')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'reportes' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
            }}
          >
            Ingresos Totales (Ventas)
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#16a34a', fontWeight: 800 }}>
            ${totalVentasBrutas.toLocaleString('es-CO')}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>
            {ventasCount} facturas emitidas
          </span>
        </div>
      )}

      {/* KPI 2: Inventario */}
      {(canManageInventory || canViewInventory) && (
        <div
          onClick={() => {
            setTabActiva('inventario');
            if (onSeleccionarFiltroStock) onSeleccionarFiltroStock('todos');
          }}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'inventario' && filtroStock === 'todos' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
            }}
          >
            Catálogo de Productos
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
            {cargandoProductos ? '...' : totalProductos}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Valor: ${valorTotalInventario.toLocaleString('es-CO')}
          </span>
        </div>
      )}

      {/* KPI 3: Alertas de Stock */}
      {(canManageInventory || canViewInventory) && (
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
            background: 'var(--bg-surface)',
            border: tabActiva === 'inventario' && filtroStock === 'bajo' 
              ? '2px solid #d97706' 
              : (productosBajoStock > 0 ? '1px solid #fde68a' : '1px solid var(--border-color)'),
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
            }}
          >
            Alertas de Stock
          </span>
          <h3
            style={{
              margin: 0,
              fontSize: '1.5rem',
              color: productosBajoStock > 0 ? '#d97706' : '#16a34a',
              fontWeight: 800,
            }}
          >
            {productosBajoStock}
          </h3>
          <span style={{ fontSize: '0.75rem', color: productosBajoStock > 0 ? '#b45309' : '#15803d', fontWeight: 600 }}>
            {productosBajoStock > 0 ? `${productosBajoStock} requieren reposición` : 'Stock en nivel óptimo'}
          </span>
        </div>
      )}

      {/* KPI 4: Proveedores */}
      {(canManageSuppliers || canViewSuppliers) && (
        <div
          onClick={() => setTabActiva('proveedores')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'proveedores' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
            }}
          >
            Proveedores
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#0284c7', fontWeight: 800 }}>
            {cargandoProveedores ? '...' : proveedoresCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 600 }}>
            {proveedoresActivosCount} aliados comerciales
          </span>
        </div>
      )}

      {/* KPI 5: Usuarios */}
      {canManageUsers && (
        <div
          onClick={() => setTabActiva('usuarios')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'usuarios' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: 700,
            }}
          >
            Usuarios en Sistema
          </span>
          <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-secondary)', fontWeight: 800 }}>
            {cargandoUsuarios ? '...' : usuariosCount}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Admin: {rolesCounts.admins} &middot; Cajero: {rolesCounts.cajeros} &middot; Sup:{' '}
            {rolesCounts.supervisores} &middot; Cont: {rolesCounts.contadores}
          </span>
        </div>
      )}
    </div>
  );
};

export default DashboardKpis;
