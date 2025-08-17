import { useState, useEffect } from 'react';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'destructive';
}

interface Toast {
  id: string;
  title?: string;
  description?: string;
  actions?: ToastAction[];
  duration?: number;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info' | 'progress';
  progress?: number;
  persistent?: boolean;
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
    case 'UPDATE_TOAST':
      memoryState = {
        ...memoryState,
        toasts: memoryState.toasts.map(t => 
          t.id === action.toast!.id ? action.toast! : t
        ),
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

  const toast = ({ ...props }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast = { ...props, id };
    
    dispatch({ type: 'ADD_TOAST', toast });
    
    // Don't auto-dismiss if persistent or if it's a progress notification
    if (!props.persistent && props.variant !== 'progress' && props.duration !== Infinity) {
      setTimeout(() => {
        dispatch({ type: 'DISMISS_TOAST', toastId: id });
      }, props.duration || 5000);
    }
    
    return id; // Return the ID so it can be updated
  };

  const updateToast = (toastId: string, updates: Partial<Omit<Toast, 'id'>>) => {
    const toastIndex = memoryState.toasts.findIndex(t => t.id === toastId);
    if (toastIndex !== -1) {
      memoryState.toasts[toastIndex] = {
        ...memoryState.toasts[toastIndex],
        ...updates
      };
      dispatch({ type: 'UPDATE_TOAST', toast: memoryState.toasts[toastIndex] });
    }
  };

  // Helper methods for different types of notifications
  const success = (message: string, title?: string) => {
    return toast({
      variant: 'success',
      title: title || 'Success',
      description: message,
    });
  };

  const error = (message: string, title?: string, actions?: ToastAction[]) => {
    return toast({
      variant: 'destructive',
      title: title || 'Error',
      description: message,
      actions,
      duration: 8000, // Errors stay longer
    });
  };

  const warning = (message: string, title?: string) => {
    return toast({
      variant: 'warning',
      title: title || 'Warning',
      description: message,
      duration: 6000,
    });
  };

  const info = (message: string, title?: string) => {
    return toast({
      variant: 'info',
      title: title || 'Info',
      description: message,
    });
  };

  const progress = (title: string, initialProgress = 0) => {
    const id = toast({
      variant: 'progress',
      title,
      progress: initialProgress,
      persistent: true,
    });

    return {
      id,
      update: (progress: number, description?: string) => {
        updateToast(id, { progress, description });
        if (progress >= 100) {
          setTimeout(() => dispatch({ type: 'DISMISS_TOAST', toastId: id }), 2000);
        }
      },
      complete: (message?: string) => {
        updateToast(id, { 
          variant: 'success',
          progress: 100,
          description: message || 'Complete!',
          persistent: false
        });
        setTimeout(() => dispatch({ type: 'DISMISS_TOAST', toastId: id }), 2000);
      },
      error: (message: string) => {
        updateToast(id, {
          variant: 'destructive',
          description: message,
          persistent: false
        });
        setTimeout(() => dispatch({ type: 'DISMISS_TOAST', toastId: id }), 5000);
      }
    };
  };

  return {
    ...state,
    toast,
    success,
    error,
    warning,
    info,
    progress,
    updateToast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}