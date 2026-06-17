import {useState, useCallback} from 'react';
import type {AppAlertConfig, AppAlertButton} from '../components/AppAlertModal/AppAlertModal';

export const useAppAlert = () => {
  const [alertConfig, setAlertConfig] = useState<AppAlertConfig | null>(null);

  const showAlert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setAlertConfig({title, message, buttons});
  }, []);

  const hideAlert = useCallback(() => setAlertConfig(null), []);

  return {alertConfig, showAlert, hideAlert};
};
