import React, { createContext, useContext, useState } from "react";
import ConfirmModal from "../components/Modals/ConfirmModal";

const ConfirmModalContext = createContext(null);

export const ConfirmModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    isDangerous: true,
    isLoading: false,
    onConfirm: () => {},
  });

  const [promise, setPromise] = useState(null);

  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setModalState((prev) => ({
        ...prev,
        ...options,
        isOpen: true,
      }));
      setPromise({ resolve });
    });
  };

  const closeConfirm = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (promise) {
      promise.resolve(false);
      setPromise(null);
    }
  };

  const handleConfirm = async () => {
    setModalState((prev) => ({ ...prev, isLoading: true }));
    try {
      await modalState.onConfirm();
    } finally {
      setModalState((prev) => ({
        ...prev,
        isLoading: false,
        isOpen: false,
      }));
      if (promise) {
        promise.resolve(true);
        setPromise(null);
      }
    }
  };

  const handleCancel = () => {
    closeConfirm();
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirm, closeConfirm }}>
      {children}

      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        isDangerous={modalState.isDangerous}
        isLoading={modalState.isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmModalContext.Provider>
  );
};

export const useConfirmModal = () => {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error(
      "useConfirmModal debe ser usado dentro de ConfirmModalProvider"
    );
  }
  return context;
};
