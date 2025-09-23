import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Context for Sidebar state
interface SidebarContextType {
  state: "open" | "collapsed";
  toggle: () => void;
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  initialState?: "open" | "collapsed";
}

export function SidebarProvider({ children, initialState = "open" }: SidebarProviderProps) {
  const [state, setState] = React.useState<"open" | "collapsed">(initialState);

  const toggle = React.useCallback(() => {
    setState((prev) => (prev === "open" ? "collapsed" : "open"));
  }, []);

  const value = React.useMemo(() => ({ state, toggle }), [state, toggle]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

const sidebarVariants = cva(
  "flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out",
  {
    variants: {
      variant: {
        default: "border-r",
        floating: "border-r",
      },
      collapsible: {
        icon: "w-16 data-[state=open]:w-64", // Adjusted for open/collapsed state
        none: "w-64",
      },
    },
    defaultVariants: {
      variant: "default",
      collapsible: "none",
    },
  }
);

interface SidebarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sidebarVariants> {
  children: React.ReactNode;
}

const Sidebar = React.forwardRef<
  HTMLDivElement,
  SidebarProps
>(({ className, variant, collapsible, children, ...props }, ref) => {
  const { state } = useSidebar(); // Use context state
  return (
    <div
      ref={ref}
      className={cn(sidebarVariants({ variant, collapsible }), className)}
      data-state={state} // Pass state to data-state attribute
      {...props}
    >
      {children}
    </div>
  );
});
Sidebar.displayName = "Sidebar";

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-0 h-full", className)} {...props}>
    {children}
  </div>
));
SidebarContent.displayName = "SidebarContent";

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2 p-4", className)} {...props}>
    {children}
  </div>
));
SidebarHeader.displayName = "SidebarHeader";

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex size-full flex-col gap-1 p-3 data-[collapsible=icon]:gap-0",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SidebarInset.displayName = "SidebarInset";

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col", className)} {...props}>
    {children}
  </div>
));
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
    {children}
  </div>
));
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "border-b px-3 py-2 font-semibold uppercase text-xs text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-2 border-t p-3 data-[collapsible=icon]:gap-0",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SidebarFooter.displayName = "SidebarFooter";

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
    {children}
  </div>
));
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean } // Add asChild prop
>(({ className, children, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(
        "flex size-12 items-center justify-center rounded-lg text-sm font-medium transition-all hover:bg-accent data-[state=open]:bg-accent",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1", className)} {...props}>
    {children}
  </div>
));
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-3 my-2 h-px bg-border", className)}
    {...props}
  />
));
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { toggle } = useSidebar(); // Use toggle from context
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors hover:bg-accent data-[state=open]:bg-accent",
        className
      )}
      onClick={toggle} // Toggle sidebar on click
      {...props}
    >
      {children}
      <span className="sr-only">Toggle Sidebar</span>
    </button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-1 flex-col items-center gap-1 p-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
SidebarRail.displayName = "SidebarRail";

export {
  SidebarProvider, // Export SidebarProvider
  useSidebar, // Export useSidebar
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
  type SidebarProps,
};