import * as React from "react";

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