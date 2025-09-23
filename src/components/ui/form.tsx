import * as React from 'react';
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label"; // Import Label component

const Form = FormProvider;

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name! }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>() => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = useFormContext<TFieldValues>();
  const { name } = fieldContext;

  const fieldState = itemContext.getFieldState(name); // Removed 'valid: true' as it's not an option

  if (!name) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const formItemId = React.useId(); // Generate a unique ID for form items

  return {
    ...fieldState,
    formItemId,
    name,
    formDescriptionId: `${formItemId}-description`,
    formMessageId: `${formItemId}-error`,
    error: itemContext.formState.errors[name], // Directly get error from formState
  };
};

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> { // Changed to HTMLDivElement
  children: React.ReactNode;
}

const FormItem = React.forwardRef<
  HTMLDivElement, // Changed to HTMLDivElement
  FormItemProps
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <div // Changed from Label to div
      ref={ref}
      className={cn(
        error && "text-destructive",
        className
      )}
      id={formItemId} // Added id for accessibility
      {...props}
    />
  );
});
FormItem.displayName = "FormItem";

interface FormLabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> { // Use LabelPrimitive.Root
  children: React.ReactNode;
}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>, // Use LabelPrimitive.Root
  FormLabelProps
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label // Use imported Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField(); // Destructure all needed properties

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    />
  );
});
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form as FormProvider,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  type ControllerProps,
};