'use client';

import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormFieldContextValue = {
  controlId: string;
  descriptionId: string;
  errorId: string;
  hasError: boolean;
  hasDescription: boolean;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField() {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) throw new Error('useFormField must be used within <FormField>');
  return ctx;
}

/**
 * Props to spread onto the control inside a FormField. Wires the label,
 * description and error message to the input without every call site having to
 * invent ids — the audit found 62 inputs with ad-hoc (and often missing)
 * label/description association.
 *
 *   <FormField label="Email" error={errors.email}>
 *     {(field) => <Input {...field} value={email} onChange={...} />}
 *   </FormField>
 */
export type FormControlProps = {
  id: string;
  'aria-describedby'?: string;
  'aria-invalid'?: true | undefined;
  'aria-required'?: true | undefined;
};

export interface FormFieldProps {
  label: React.ReactNode;
  /** Helper text rendered under the control and linked via aria-describedby. */
  description?: React.ReactNode;
  /** When set, the control is marked invalid and the message is announced. */
  error?: string | null;
  required?: boolean;
  /** Visually hide the label but keep it for assistive tech. */
  hideLabel?: boolean;
  className?: string;
  children: (field: FormControlProps) => React.ReactNode;
}

export function FormField({
  label,
  description,
  error,
  required,
  hideLabel,
  className,
  children,
}: FormFieldProps) {
  const reactId = React.useId();
  const controlId = `${reactId}-control`;
  const descriptionId = `${reactId}-description`;
  const errorId = `${reactId}-error`;

  const hasError = Boolean(error);
  const hasDescription = Boolean(description);

  const describedBy =
    [hasDescription ? descriptionId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const field: FormControlProps = {
    id: controlId,
    'aria-describedby': describedBy,
    'aria-invalid': hasError || undefined,
    'aria-required': required || undefined,
  };

  const ctx: FormFieldContextValue = {
    controlId,
    descriptionId,
    errorId,
    hasError,
    hasDescription,
  };

  return (
    <FormFieldContext.Provider value={ctx}>
      <div className={cn('space-y-1.5', className)}>
        <Label htmlFor={controlId} className={cn(hideLabel && 'sr-only')}>
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
              <span className="sr-only"> (required)</span>
            </>
          )}
        </Label>

        {children(field)}

        {hasDescription && (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {hasError && (
          <p
            id={errorId}
            // Announced when validation fails without stealing focus.
            role="alert"
            className="flex items-start gap-1.5 text-xs font-medium text-destructive"
          >
            <AlertCircle className="icon-xs mt-px shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}

export { useFormField };
