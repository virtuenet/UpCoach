import React, { useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';

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
  toast: (props: Omit<Toast, 'id'>) => string;
  dismiss: (toastId?: string) => void;
}

// Use WeakMap for better memory management
const listeners = new Set<(state: ToastState) => void>();
const toastTimeouts = new WeakMap<object, NodeJS.Timeout>();

let memoryState: ToastState = {
  toasts: [],
  toast: () => '',
  dismiss: () => {},
};

function dispatch(action: {
  type: 'ADD_TOAST' | 'UPDATE_TOAST' | 'DISMISS_TOAST' | 'REMOVE_TOAST';
  toast?: Toast;
  toastId?: string;
}) {
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
        toasts: memoryState.toasts.map(t => (t.id === action.toast!.id ? action.toast! : t)),
      };
      break;
    case 'DISMISS_TOAST':
      if (action.toastId) {
        // Clear any associated timeout
        const toast = memoryState.toasts.find(t => t.id === action.toastId);
        if (toast && toastTimeouts.has(toast)) {
          clearTimeout(toastTimeouts.get(toast)!);
          toastTimeouts.delete(toast);
        }

        memoryState = {
          ...memoryState,
          toasts: memoryState.toasts.filter(t => t.id !== action.toastId),
        };
      } else {
        // Clear all timeouts
        memoryState.toasts.forEach(toast => {
          if (toastTimeouts.has(toast)) {
            clearTimeout(toastTimeouts.get(toast)!);
            toastTimeouts.delete(toast);
          }
        });

        memoryState = {
          ...memoryState,
          toasts: [],
        };
      }
      break;
  }

  // Notify all listeners
  listeners.forEach(listener => {
    listener(memoryState);
  });
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Add listener
    const updateState = (newState: ToastState) => {
      if (mountedRef.current) {
        setState(newState);
      }
    };

    listeners.add(updateState);

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      listeners.delete(updateState);
    };
  }, []); // Remove state dependency to prevent infinite loop

  const toast = useCallback(({ ...props }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toastObj: Toast = { ...props, id };

    dispatch({ type: 'ADD_TOAST', toast: toastObj });

    // Don't auto-dismiss if persistent or if it's a progress notification
    if (!props.persistent && props.variant !== 'progress' && props.duration !== Infinity) {
      const timeout = setTimeout(() => {
        dispatch({ type: 'DISMISS_TOAST', toastId: id });
      }, props.duration || 5000);

      // Store timeout reference for cleanup
      toastTimeouts.set(toastObj, timeout);
    }

    return id; // Return the ID so it can be updated
  }, []);

  const updateToast = useCallback((toastId: string, updates: Partial<Omit<Toast, 'id'>>) => {
    const toastIndex = memoryState.toasts.findIndex(t => t.id === toastId);
    if (toastIndex !== -1) {
      const updatedToast = {
        ...memoryState.toasts[toastIndex],
        ...updates,
      };
      dispatch({ type: 'UPDATE_TOAST', toast: updatedToast });
    }
  }, []);

  const dismiss = useCallback((toastId?: string) => {
    dispatch({ type: 'DISMISS_TOAST', toastId });
  }, []);

  // Helper methods for different types of notifications
  const success = useCallback(
    (message: string, title?: string) => {
      return toast({
        variant: 'success',
        title: title || 'Success',
        description: message,
      });
    },
    [toast]
  );

  const error = useCallback(
    (message: string, title?: string, actions?: ToastAction[]) => {
      return toast({
        variant: 'destructive',
        title: title || 'Error',
        description: message,
        actions,
        duration: 8000, // Errors stay longer
      });
    },
    [toast]
  );

  const warning = useCallback(
    (message: string, title?: string) => {
      return toast({
        variant: 'warning',
        title: title || 'Warning',
        description: message,
        duration: 6000,
      });
    },
    [toast]
  );

  const info = useCallback(
    (message: string, title?: string) => {
      return toast({
        variant: 'info',
        title: title || 'Info',
        description: message,
      });
    },
    [toast]
  );

  const progress = useCallback(
    (title: string, initialProgress = 0) => {
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
            setTimeout(() => dismiss(id), 2000);
          }
        },
        complete: (message?: string) => {
          updateToast(id, {
            variant: 'success',
            progress: 100,
            description: message || 'Complete!',
            persistent: false,
          });
          setTimeout(() => dismiss(id), 2000);
        },
        error: (message: string) => {
          updateToast(id, {
            variant: 'destructive',
            description: message,
            persistent: false,
          });
          setTimeout(() => dismiss(id), 5000);
        },
      };
    },
    [toast, updateToast, dismiss]
  );

  return {
    ...state,
    toast,
    success,
    error,
    warning,
    info,
    progress,
    updateToast,
    dismiss,
  };
}

// Cleanup function for when the app unmounts
export function cleanupToasts() {
  // Clear all listeners
  listeners.clear();

  // Clear all toasts
  memoryState = {
    toasts: [],
    toast: () => '',
    dismiss: () => {},
  };
}
