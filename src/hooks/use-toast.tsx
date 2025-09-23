import { toast } from 'sonner';

export function useToast() {
  return {
    toast: (options: {
      title?: string;
      description?: string;
      action?: React.ReactNode;
      variant?: 'default' | 'destructive';
      duration?: number;
    }) => {
      const { title, description, variant = 'default', duration = 5000 } = options;
      
      if (title || description) {
        toast[options.variant || 'default']({
          title,
          description,
          duration,
        });
      }
    },
  };
}