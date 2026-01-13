import { useEffect, useState } from 'react';
import type { NotificationType } from '../types';
import './Notification.css';

interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

export function Notification({ message, type, duration = 3000, onClose }: NotificationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!show) return null;

  return (
    <div className={`notification notification-${type} ${show ? 'notification-show' : ''}`}>
      <div className="notification-content">
        <span className="notification-icon">{getIcon(type)}</span>
        <span className="notification-message">{message}</span>
      </div>
    </div>
  );
}

function getIcon(type: NotificationType): string {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ℹ';
    default:
      return '•';
  }
}

