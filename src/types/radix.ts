import * as React from 'react';

// Tipos genéricos para Radix primitives (substitui imports ausentes)
declare module '@radix-ui/react-slot' {
  export const Slot: React.ForwardRefExoticComponent<
    React.PropsWithChildren<{
      children?: React.ReactNode;
      [key: string]: any;
    }> & React.RefAttributes<HTMLElement>
  >;
}

// Tipos para outros Radix (exemplo para toast, tooltip, etc.)
declare module '@radix-ui/react-toast' {
  export const ToastProvider: React.FC<{ children: React.ReactNode }>;
  export const Toaster: React.FC<{ children: React.ReactNode }>;
  export const ToastViewport: React.ForwardRefExoticComponent<
    React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>> & React.RefAttributes<HTMLDivElement>
  >;
  export const Toast: React.ForwardRefExoticComponent<
    React.PropsWithChildren<any> & React.RefAttributes<HTMLDivElement>
  >;
  export const ToastTitle: React.ForwardRefExoticComponent<
    React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>> & React.RefAttributes<HTMLHeadingElement>
  >;
  export const ToastDescription: React.ForwardRefExoticComponent<
    React.PropsWithChildren<React.HTMLAttributes<HTMLParagraphElement>> & React.RefAttributes<HTMLParagraphElement>
  >;
  export const ToastAction: React.ForwardRefExoticComponent<
    React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>> & React.RefAttributes<HTMLButtonElement>
  >;
  export const ToastClose: React.ForwardRefExoticComponent<
    React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>> & React.RefAttributes<HTMLButtonElement>
  >;
}

// Similar para tooltip
declare module '@radix-ui/react-tooltip' {
  export const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }>;
  export const Tooltip: React.FC<{ children: React.ReactNode }>;
  export const TooltipTrigger: React.FC<{ children: React.ReactNode }>;
  export const TooltipContent: React.ForwardRefExoticComponent<
    React.PropsWithChildren<{
      className?: string;
      sideOffset?: number;
      [key: string]: any;
    }> & React.RefAttributes<HTMLDivElement>
  >;
}

// Adicione para outros Radix conforme necessário (ex: dialog, select, etc.)
declare module '@radix-ui/react-dialog' {
  export const Dialog: React.FC<{ children: React.ReactNode }>;
  export const DialogTrigger: React.FC<{ children: React.ReactNode }>;
  export const DialogContent: React.ForwardRefExoticComponent<
    React.PropsWithChildren<{
      className?: string;
      [key: string]: any;
    }> & React.RefAttributes<HTMLDivElement>
  >;
  export const DialogTitle: React.ForwardRefExoticComponent<
    React.PropsWithChildren<React.HTMLAttributes<HTMLHeadingElement>> & React.RefAttributes<HTMLHeadingElement>
  >;
  export const DialogDescription: React.ForwardRefExoticComponent<
    React.PropsWithChildren<React.HTMLAttributes<HTMLParagraphElement>> & React.RefAttributes<HTMLParagraphElement>
  >;
  export const DialogClose: React.FC<{ children: React.ReactNode }>;
}

// Para Supabase (resolvendo import)
declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    email: string;
    user_metadata: any;
  }
  export interface Session {
    user: User | null;
  }
  export const createClient: (url: string, key: string, options?: any) => any;
}

// Para outros módulos (ex: recharts, se usado)
declare module 'recharts' {
  export const LineChart: React.FC<any>;
  export const Line: React.FC<any>;
  export const XAxis: React.FC<any>;
  export const YAxis: React.FC<any>;
  export const CartesianGrid: React.FC<any>;
  export const Tooltip: React.FC<any>;
  export const Legend: React.FC<any>;
  export const ResponsiveContainer: React.FC<any>;
}