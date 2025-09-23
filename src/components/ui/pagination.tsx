import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button'; // Import Button and ButtonProps

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-row items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

const PaginationLink = React.forwardRef<
  HTMLAnchorElement,
  ButtonProps & React.HTMLAttributes<HTMLAnchorElement> // Use ButtonProps directly
>(({ className, isActive, size = 'default', ...props }, ref) => (
  <Button
    ref={ref}
    variant={isActive ? 'default' : 'outline'}
    size={size}
    className={cn('gap-1 pl-2.5', className)}
    {...props}
  />
));
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof PaginationLink>
>(({ className, ...props }, ref) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    ref={ref}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Anterior</span>
  </PaginationLink>
));
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<typeof PaginationLink>
>(({ className, ...props }, ref) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn('gap-1 pl-2.5', className)}
    ref={ref}
    {...props}
  >
    <span>Próxima</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
));
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  />
));
PaginationEllipsis.displayName = 'PaginationEllipsis';

export {
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};