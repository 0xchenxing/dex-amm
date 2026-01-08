import { useState, useCallback } from 'react';
import type { NotificationType } from '../types';
import { Notification } from '../components/Notification';

export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  const showNotification = useCallback((message: string, type: NotificationType = 'success') => {
    setNotification({ message, type });
  }, []);

  const NotificationComponent = notification ? (
    <Notification
      message={notification.message}
      type={notification.type}
      onClose={() => setNotification(null)}
    />
  ) : null;

  return { showNotification, NotificationComponent };
}

