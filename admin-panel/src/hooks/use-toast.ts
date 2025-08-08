import { useState, useEffect } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  duration?: number;
  variant?: 'default' | 'destructive';
}

interface ToastState {
  toasts: Toast[];
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (toastId?: string) => void;
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [], toast: () => {}, dismiss: () => {} };

function dispatch(action: { type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST'; toast?: Toast; toastId?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      memoryState = {
        ...memoryState,
        toasts: [...memoryState.toasts, action.toast!],
      };
      break;
    case 'DISMISS_TOAST':
      if (action.toastId) {
        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.filter(t => t.id !== action.toastId),
        };
      } else {
        memoryState = {
          ...memoryState,
          toasts: [],
        };
      }
      break;
  }
  
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast: ({ ...props }) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast = { ...props, id };
      
      dispatch({ type: 'ADD_TOAST', toast });
      
      if (props.duration !== Infinity) {
        setTimeout(() => {
          dispatch({ type: 'DISMISS_TOAST', toastId: id });
        }, props.duration || 5000);
      }
    },
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}