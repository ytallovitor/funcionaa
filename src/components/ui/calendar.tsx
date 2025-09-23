import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Button,
  buttonVariants, // Keep buttonVariants for type inference in CalendarTitle
} from '@/components/ui/button';
import { VariantProps } from 'class-variance-authority'; // Import VariantProps

interface CalendarButtonProps // Renamed to avoid conflict with ButtonProps from button.tsx
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Calendar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-md border", className)} {...props} />
));
Calendar.displayName = "Calendar";

const CalendarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-3",
      className
    )}
    {...props}
  />
));
CalendarHeader.displayName = "CalendarHeader";

const CalendarTitle = React.forwardRef<
  HTMLButtonElement,
  CalendarButtonProps // Use CalendarButtonProps
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "text-sm font-medium",
      buttonVariants({
        variant: "ghost",
      }),
      className
    )}
    {...props}
  >
    {children}
  </button>
));
CalendarTitle.displayName = "CalendarTitle";

const CalendarActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center space-x-1", className)}
    {...props}
  >
    {children}
  </div>
));
CalendarActions.displayName = "CalendarActions";

const CalendarAction = React.forwardRef<
  HTMLButtonElement,
  CalendarButtonProps // Use CalendarButtonProps
>(({ className, variant = "ghost", size = "icon", ...props }, ref) => (
  <Button
    ref={ref}
    variant={variant}
    size={size}
    className={cn(
      "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
      className
    )}
    {...props}
  />
));
CalendarAction.displayName = "CalendarAction";

const CalendarBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
));
CalendarBody.displayName = "CalendarBody";

const CalendarTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <table
    ref={ref}
    className={cn("w-full border-collapse space-y-1", className)}
    {...props}
  />
));
CalendarTable.displayName = "CalendarTable";

const CalendarHeaderRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "flex w-full mt-2",
      className
    )}
    {...props}
  />
));
CalendarHeaderRow.displayName = "CalendarHeaderRow";

interface CalendarHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  hidden?: boolean;
}

const CalendarHeaderCell = React.forwardRef<
  HTMLTableCellElement,
  CalendarHeaderCellProps
>(({ className, hidden = false, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "text-h3 font-normal text-muted-foreground rounded-md w-9 h-9",
      hidden && "invisible",
      className
    )}
    {...props}
  />
));
CalendarHeaderCell.displayName = "CalendarHeaderCell";

const CalendarRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "flex w-full mt-2",
      className
    )}
    {...props}
  />
));
CalendarRow.displayName = "CalendarRow";

const CalendarCell = React.forwardRef<
  HTMLTableCellElement,
  React.HTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("text-sm p-0 relative", className)}
    {...props}
  />
));
CalendarCell.displayName = "CalendarCell";

export {
  Calendar,
  CalendarHeader,
  CalendarBody,
  CalendarTitle,
  CalendarActions,
  CalendarAction,
  CalendarTable,
  CalendarHeaderRow,
  CalendarHeaderCell,
  CalendarRow,
  CalendarCell,
};