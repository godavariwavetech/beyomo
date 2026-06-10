import { useState } from 'react';

const useCustomAlert = () => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (title, message, type = 'error') => {
    setAlertConfig({ title, message, type });
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const showSuccess = (title, message) => {
    showAlert(title, message, 'success');
  };

  const showError = (title, message) => {
    showAlert(title, message, 'error');
  };

  const showInfo = (title, message) => {
    showAlert(title, message, 'info');
  };

  const showWarning = (title, message) => {
    showAlert(title, message, 'warning');
  };

  return {
    alertVisible,
    alertConfig,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};

export default useCustomAlert; 