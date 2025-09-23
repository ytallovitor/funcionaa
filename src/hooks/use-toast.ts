import { toast } from 'sonner'; // Usando toast direto do sonner (sem useToast)

export function useToast() {
  return {
    toast: (options: {
      title?: string;
      description?: string;
      action?: React.ReactNode;
      variant?: 'default' | 'destructive';
      duration?: number;
    }) => {
      const { title, description, action, variant = 'default', duration = 5000 } = options;
      
      if (title || description) {
        toast.custom((t) => (
          <div className="flex flex-col gap-2 p-4 bg-background rounded-lg shadow-lg border">
            {title && <p className="font-semibold text-foreground">{title}</p>}
            {description && <p className="text-foreground">{description}</p>}
            {action && <div>{action}</div>}
          </div>
        ), {
          duration,
          style: variant === 'destructive' ? { backgroundColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive-foreground))' } : undefined,
        });
      }
    },
  };
}