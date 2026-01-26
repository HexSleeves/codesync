/**
 * Simple form management for Hono JSX
 *
 * Since TanStack React Form uses React hooks internally which are incompatible
 * with Hono JSX, we implement a simple form API that works with Hono's useState.
 */

import { useCallback, useMemo, useState } from 'hono/jsx';
import type { JSX } from 'hono/jsx/jsx-runtime';

type FieldState<T> = {
  value: T;
  meta: {
    isTouched: boolean;
    isDirty: boolean;
  };
};

type FormState<TFormData> = {
  values: TFormData;
  isSubmitting: boolean;
  isValid: boolean;
  fieldMeta: Record<string, { isTouched: boolean; isDirty: boolean }>;
};

type FieldApi<TFormData, TName extends keyof TFormData> = {
  state: FieldState<TFormData[TName]>;
  handleChange: (value: TFormData[TName]) => void;
  handleBlur: () => void;
};

export interface UseFormOptions<TFormData> {
  defaultValues: TFormData;
  onSubmit: (props: { value: TFormData }) => void | Promise<void>;
}

export function useForm<TFormData extends Record<string, any>>(opts: UseFormOptions<TFormData>) {
  const [values, setValues] = useState<TFormData>(opts.defaultValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldMeta, setFieldMeta] = useState<
    Record<string, { isTouched: boolean; isDirty: boolean }>
  >({});

  const reset = useCallback(() => {
    setValues(opts.defaultValues);
    setFieldMeta({});
    setIsSubmitting(false);
  }, []);

  const setFieldValue = useCallback(
    <TName extends keyof TFormData>(name: TName, value: TFormData[TName]) => {
      // setValues((prev) => ({ ...prev, [name]: value }));
      // setFieldMeta((prev) => ({
      //   ...prev,
      //   [name as string]: { ...prev[name as string], isDirty: true },
      // }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await opts.onSubmit({ value: values });
    } finally {
      setIsSubmitting(false);
    }
  }, [values, opts.onSubmit]);

  // Field component
  const Field = useMemo(() => {
    return function FormField<TName extends keyof TFormData & string>({
      name,
      children,
    }: {
      name: TName;
      children: (field: FieldApi<TFormData, TName>) => JSX.Element;
    }): JSX.Element {
      const fieldState: FieldState<TFormData[TName]> = {
        value: values[name],
        meta: fieldMeta[name] || { isTouched: false, isDirty: false },
      };

      const fieldApi: FieldApi<TFormData, TName> = {
        state: fieldState,
        handleChange: (value) => setFieldValue(name, value),
        handleBlur: () => {
          setFieldMeta((prev) => ({
            ...prev,
            [name]: { ...prev[name], isTouched: true },
          }));
        },
      };

      return children(fieldApi);
    };
  }, [values, fieldMeta, setFieldValue]);

  // Subscribe component
  const Subscribe = useMemo(() => {
    return function FormSubscribe<TSelected>({
      selector,
      children,
    }: {
      selector: (state: FormState<TFormData>) => TSelected;
      children: (selected: TSelected) => JSX.Element;
    }): JSX.Element {
      const state: FormState<TFormData> = {
        values,
        isSubmitting,
        isValid: true,
        fieldMeta,
      };
      return children(selector(state));
    };
  }, [values, isSubmitting, fieldMeta]);

  return {
    Field,
    Subscribe,
    handleSubmit,
    reset,
    setFieldValue,
    state: {
      values,
      isSubmitting,
      fieldMeta,
    },
  };
}
