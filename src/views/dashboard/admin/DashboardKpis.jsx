import React from 'react';
import { toast } from 'sonner';
import { DollarSign, Package, AlertTriangle, Truck, Users, CheckCircle2 } from 'lucide-react';

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
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {/* KPI 1: Finanzas / Ventas */}
      {canViewReports && (
        <div
          onClick={() => setTabActiva('reportes')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'reportes' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontWeight: 700,
              }}
            >
              Ingresos Totales
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.12)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.65rem', color: '#16a34a', fontWeight: 800, letterSpacing: '-0.5px' }}>
              ${totalVentasBrutas.toLocaleString('es-CO')}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {ventasCount} {ventasCount === 1 ? 'factura emitida' : 'facturas emitidas'}
            </span>
          </div>
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
            borderRadius: '16px',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'inventario' && filtroStock === 'todos' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontWeight: 700,
              }}
            >
              Catálogo de Productos
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--accent-primary-subtle)',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={18} />
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.65rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {cargandoProductos ? '...' : totalProductos}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Valor en stock: ${valorTotalInventario.toLocaleString('es-CO')}
            </span>
          </div>
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
            borderRadius: '16px',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontWeight: 700,
              }}
            >
              Alertas de Stock
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: productosBajoStock > 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(34, 197, 94, 0.12)',
                color: productosBajoStock > 0 ? '#d97706' : '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {productosBajoStock > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            </div>
          </div>
          <div>
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '1.65rem',
                color: productosBajoStock > 0 ? '#d97706' : '#16a34a',
                fontWeight: 800,
                letterSpacing: '-0.5px',
              }}
            >
              {productosBajoStock}
            </h3>
            <span style={{ fontSize: '0.8rem', color: productosBajoStock > 0 ? '#b45309' : '#15803d', fontWeight: 600 }}>
              {productosBajoStock > 0 ? `${productosBajoStock} requieren reposición` : 'Nivel óptimo en existencias'}
            </span>
          </div>
        </div>
      )}

      {/* KPI 4: Proveedores */}
      {(canManageSuppliers || canViewSuppliers) && (
        <div
          onClick={() => setTabActiva('proveedores')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'proveedores' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontWeight: 700,
              }}
            >
              Proveedores
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.12)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Truck size={18} />
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.65rem', color: '#0284c7', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {cargandoProveedores ? '...' : proveedoresCount}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              {proveedoresActivosCount} aliados comerciales
            </span>
          </div>
        </div>
      )}

      {/* KPI 5: Usuarios */}
      {canManageUsers && (
        <div
          onClick={() => setTabActiva('usuarios')}
          style={{
            background: 'var(--bg-surface)',
            borderRadius: '16px',
            padding: '1.4rem 1.6rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: 'var(--card-shadow)',
            border: tabActiva === 'usuarios' ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                fontWeight: 700,
              }}
            >
              Usuarios en Sistema
            </span>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Users size={18} />
            </div>
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.65rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.5px' }}>
              {cargandoUsuarios ? '...' : usuariosCount}
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Admin: {rolesCounts.admins} · Cajero: {rolesCounts.cajeros} · Sup: {rolesCounts.supervisores} · Cont: {rolesCounts.contadores}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardKpis;

