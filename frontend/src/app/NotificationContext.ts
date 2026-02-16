import { createContext } from 'react';

export type Severity = 'success' | 'error' | 'warning' | 'info';

export interface NotificationContextValue {
  notify: (message: string, severity?: Severity) => void;
}

export const NotificationContext = createContext<NotificationContextValue>({
  notify: () => {},
});
