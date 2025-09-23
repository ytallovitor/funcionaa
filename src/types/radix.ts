import * as React from 'react';

// Apenas declare o Slot essencial (resolve TS2307 em button, sidebar, breadcrumb, form)
declare module '@radix-ui/react-slot' {
  export const Slot: React.ForwardRefExoticComponent<
    React.PropsWithChildren<{
      children?: React.ReactNode;
      [key: string]: any;
    }> & React.RefAttributes<HTMLElement>
  >;
}

// Tipos para Supabase User/Session (corrigindo TS2717, TS2687 - compatível com @supabase/supabase-js)
declare module '@supabase/supabase-js' {
  export interface User {
    id: string;
    email?: string;
    user_metadata?: any;
  }
  export interface Session {
    user: User | null;
  }
  export const createClient: (url: string, key: string, options?: any) => any;
}

// Não declare recharts aqui - o pacote já exporta (resolve TS6200)