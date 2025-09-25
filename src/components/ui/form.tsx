import * as React from "react"
import { useForm, FormProvider, useFormContext } from "react-hook-form"

import * as FormPrimitive from "@radix-ui/react-slot"
import { FieldValues, Path, FieldError } from "react-hook-form"

import { cn } from "@/lib/utils"

const Form = React.forwardRef<
  React.ElementRef<typeof FormPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof FormPrimitive.Root>
>(({ className, ...props }, ref) => (
  <FormPrimitive.Root
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
Form.displayName = "Form"

interface FormProps<TFieldValues extends FieldValues> {
  children: (methods: UseFormReturn<TFieldValues>) => React.ReactNode
  onSubmit: (values: TFieldValues) => any
  className?: string
}

export function Form<TFieldValues extends FieldValues>({
  children,
  onSubmit,
  className,
  ...props
}: FormProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    mode: 'onChange',
  })

  React.useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name === 'root') return
      form.setFocus(name as Path<TFieldValues>, { shouldSelect: true } as any)
    })
    return () => subscription.unsubscribe()
  }, [form.watch])

  return (
    <FormProvider {...form}>
      <form
        className={cn("space-y-2", className)}
        onSubmit={form.handleSubmit(onSubmit)}
        {...props}
      >
        {children(form)}
      </form>
    </FormProvider>
  )
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues
> {
  name: Path<TFieldValues>
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const useFormField = <
  TFieldValues extends FieldValues = FieldValues
>() => {
  const fieldContext = useFormContext<TFieldValues>()
  const [name, setName] = React.useState<Path<TFieldValues>>('' as Path<TFieldValues>)

  React.useEffect(() => {
    const subscription = fieldContext.watch((value, { name }) => {
      if (name === 'root') return
      setName(name as Path<TFieldValues>)
    })
    return () => subscription.unsubscribe()
  }, [fieldContext])

  const fieldState = fieldContext.getFieldState(name, fieldContext.formState)

  return {
    name,
    ...fieldState,
  }
}

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      />
    )
  }
)
FormItem.displayName = "FormItem"

interface FormLabelProps
  extends React.ComponentProps<"label">
{}

const FormLabel = React.forwardRef<
  React.ElementRef<typeof FormPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof FormPrimitive.Root> &
    FormLabelProps
>(({ className, ...props }, ref) => {
  const { error, formState } = useFormField()

  return (
    <FormPrimitive.Root
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        error && "text-destructive",
        className
      )}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

interface FormControlProps
  extends React.ComponentProps<"input">
{}

const FormControl = React.forwardRef<
  React.ElementRef<typeof FormPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof FormPrimitive.Root> &
    FormControlProps
>(({ className, ...props }, ref) => {
  const { error, formState } = useFormField()

  return (
    <FormPrimitive.Root
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        error && "border-destructive",
        className
      )}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>
> extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  name: TName
}

const FormField = React.forwardRef<
  React.ElementRef<typeof FormItem>,
  FormFieldProps
>(({ children, className, name, ...props }, ref) => {
  const fieldContext = React.useContext(FormFieldContext)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <Form.Field>")
  }

  const itemProps = React.useMemo(
    () => ({ ...props, ref }),
    [props, ref]
  )

  return (
    <FormFieldContext.Provider value={{ name }}>
      <FormItem {...itemProps}>
        {children}
      </FormItem>
    </FormFieldContext.Provider>
  )
})
FormField.displayName = "FormField"

interface FormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement>
{}

const FormMessage = React.forwardRef<
  React.ElementRef<"p">,
  React.ComponentPropsWithoutRef<"p"> & FormMessageProps
>(({ className, children, ...props }, ref) => {
  const { error, formState } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
  FormProvider
}