/**
 * Toast notifications using Sonner
 * 
 * Since Sonner's Toaster component is React-based and won't work with Hono JSX-DOM,
 * we initialize it manually via DOM manipulation and only export the toast function.
 */
import { Toaster as SonnerToaster, toast } from 'sonner';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

let initialized = false;

/**
 * Initialize the Toaster by mounting it to a container element.
 * This is called automatically when the first toast is triggered.
 */
export function initToaster() {
  if (initialized) return;
  initialized = true;

  // Create container element
  const container = document.createElement('div');
  container.id = 'sonner-toaster';
  document.body.appendChild(container);

  // Mount React component
  const root = createRoot(container);
  root.render(
    createElement(SonnerToaster, {
      position: 'top-right',
      richColors: true,
      closeButton: true,
      className: 'toaster group',
      toastOptions: {
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error:
            'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive',
          success:
            'group-[.toaster]:bg-green-500/10 group-[.toaster]:text-green-500 group-[.toaster]:border-green-500/50',
        },
      },
    })
  );
}

// Wrap toast functions to auto-init
const wrappedToast = Object.assign(
  (message: string, options?: Parameters<typeof toast>[1]) => {
    initToaster();
    return toast(message, options);
  },
  {
    success: (message: string, options?: Parameters<typeof toast.success>[1]) => {
      initToaster();
      return toast.success(message, options);
    },
    error: (message: string, options?: Parameters<typeof toast.error>[1]) => {
      initToaster();
      return toast.error(message, options);
    },
    warning: (message: string, options?: Parameters<typeof toast.warning>[1]) => {
      initToaster();
      return toast.warning(message, options);
    },
    info: (message: string, options?: Parameters<typeof toast.info>[1]) => {
      initToaster();
      return toast.info(message, options);
    },
    loading: (message: string, options?: Parameters<typeof toast.loading>[1]) => {
      initToaster();
      return toast.loading(message, options);
    },
    promise: toast.promise,
    dismiss: toast.dismiss,
    message: toast.message,
    custom: toast.custom,
  }
);

export { wrappedToast as toast };
