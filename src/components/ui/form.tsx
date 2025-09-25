import * as React from "react"
import { useForm, FormProvider, useFormContext, useFormState } from "react-hook-form"

import { cn } from "@/lib/utils"

import type { FieldValues, Path, FieldError } from "react-hook-form"

interface FormProps<TFieldValues extends FieldValues> {
  children: (methods: ReturnType<typeof useForm<TFieldValues>>) => React.ReactNode
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
    const subscription = form.watch(({ name }) => {
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
  const [name, setName] = React.useState<Path<TFieldValues>>("" as Path<TFieldValues>)

  React.useEffect(() => {
    const subscription = fieldContext.watch(({ name }) => {
      if (name === 'root') return
      setName(name as Path<TFieldValues>)
    })
    return () => subscription.unsubscribe()
  }, [fieldContext])

  const formState = useFormState<TFieldValues>({
    control: fieldContext.control,
    name,
  })

  const fieldError = formState.errors[name as Path<TFieldValues>] as FieldError | undefined

  return {
    name,
    ...formState,
    error: fieldError,
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
  React.ElementRef<"label">,
  React.ComponentPropsWithoutRef<"label"> &
    FormLabelProps
>(({ className, ...props }, ref) => {
  const { error } = useFormField()

  return (
    <label
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
  React.ElementRef<"input">,
  React.ComponentPropsWithoutRef<"input"> &
    FormControlProps
>(({ className, ...props }, ref) => {
  const { error } = useFormField()

  return (
    <input
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
  const { error } = useFormField()
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