import React, { useState, useCallback } from 'react';
import ConfirmModal from '../components/ConfirmModal';

/**
 * Hook para invocar diálogos de confirmación modernos y atractivos basados en Promesas.
 * Reemplaza completamente los toscos 'window.confirm' del navegador.
 *
 * Uso:
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * const ok = await confirm({
 *   title: '¿Eliminar usuario?',
 *   message: '¿Estás seguro de eliminar a "Admin"?',
 *   confirmText: 'Sí, eliminar',
 *   variant: 'danger',
 * });
 * if (!ok) return;
 */
export const useConfirm = () => {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    variant: 'danger',
    resolve: null,
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || '¿Estás seguro?',
        message: options.message || 'Esta acción no se puede deshacer.',
        confirmText: options.confirmText || 'Sí, continuar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'danger',
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) state.resolve(true);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    if (state.resolve) state.resolve(false);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolve]);

  const ConfirmDialog = useCallback(() => (
    <ConfirmModal
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      variant={state.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ), [state, handleConfirm, handleCancel]);

  return { confirm, ConfirmDialog };
};

export default useConfirm;
