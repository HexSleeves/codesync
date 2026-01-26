/**
 * Simple form management for Hono JSX
 *
 * Since TanStack React Form uses React hooks internally which are incompatible
 * with Hono JSX, we implement a simple form API that works with Hono's useState.
 */

import { useCallback, useRef, useState } from 'hono/jsx';

type FieldMeta = { isTouched: boolean; isDirty: boolean };

export interface UseFormOptions<TFormData> {
  defaultValues: TFormData;
  onSubmit: (props: { value: TFormData }) => void | Promise<void>;
}

export interface UseFormReturn<TFormData> {
  values: TFormData;
  isSubmitting: boolean;
  fieldMeta: Record<string, FieldMeta>;
  getFieldProps: <K extends keyof TFormData>(
    name: K
  ) => {
    value: TFormData[K];
    onInput: (e: Event) => void;
    onBlur: () => void;
  };
  getTextAreaProps: <K extends keyof TFormData>(
    name: K
  ) => {
    value: TFormData[K];
    onInput: (e: Event) => void;
    onBlur: () => void;
  };
  getCheckboxProps: <K extends keyof TFormData>(
    name: K
  ) => {
    checked: boolean;
    onChange: (e: Event) => void;
  };
  handleSubmit: () => Promise<void>;
  reset: () => void;
  setFieldValue: <K extends keyof TFormData>(name: K, value: TFormData[K]) => void;
}

export function useForm<TFormData extends Record<string, any>>(
  opts: UseFormOptions<TFormData>
): UseFormReturn<TFormData> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState<TFormData>(opts.defaultValues);
  const [fieldMeta, setFieldMeta] = useState<Record<string, FieldMeta>>({});

  // Keep a ref to current values for handleSubmit
  const valuesRef = useRef(values);
  valuesRef.current! = values;

  const setFieldValue = useCallback(<K extends keyof TFormData>(name: K, value: TFormData[K]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setFieldMeta((prev) => ({
      ...prev,
      [name as string]: { isTouched: prev[name as string]?.isTouched ?? false, isDirty: true },
    }));
  }, []);

  const setFieldTouched = useCallback((name: string) => {
    setFieldMeta((prev) => ({
      ...prev,
      [name]: { isTouched: true, isDirty: prev[name]?.isDirty ?? false },
    }));
  }, []);

  const reset = useCallback(() => {
    setValues(opts.defaultValues);
    setFieldMeta({});
    setIsSubmitting(false);
  }, [opts.defaultValues]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await opts.onSubmit({ value: valuesRef.current! });
    } finally {
      setIsSubmitting(false);
    }
  }, [opts.onSubmit]);

  const getFieldProps = useCallback(
    <K extends keyof TFormData>(name: K) => ({
      value: values[name],
      onInput: (e: Event) => {
        const target = e.target as HTMLInputElement;
        setFieldValue(name, target.value as TFormData[K]);
      },
      onBlur: () => setFieldTouched(name as string),
    }),
    [values, setFieldValue, setFieldTouched]
  );

  const getTextAreaProps = useCallback(
    <K extends keyof TFormData>(name: K) => ({
      value: values[name],
      onInput: (e: Event) => {
        const target = e.target as HTMLTextAreaElement;
        setFieldValue(name, target.value as TFormData[K]);
      },
      onBlur: () => setFieldTouched(name as string),
    }),
    [values, setFieldValue, setFieldTouched]
  );

  const getCheckboxProps = useCallback(
    <K extends keyof TFormData>(name: K) => ({
      checked: Boolean(values[name]),
      onChange: (e: Event) => {
        const target = e.target as HTMLInputElement;
        setFieldValue(name, target.checked as TFormData[K]);
      },
    }),
    [values, setFieldValue]
  );

  return {
    values,
    isSubmitting,
    fieldMeta,
    getFieldProps,
    getTextAreaProps,
    getCheckboxProps,
    handleSubmit,
    reset,
    setFieldValue,
  };
}
