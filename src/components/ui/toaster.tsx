import * as React from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Toast,
  ToastAction,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';

export function Toaster() {
  const { toast } = useToast();

  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  );
}