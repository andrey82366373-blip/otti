"use client";

import { useState } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = Omit<React.ComponentProps<"input">, "id" | "name"> & {
  name: string;
  label: string;
  error?: string;
  hint?: string;
};

/** Поле формы: подпись, само поле, подсказка и текст ошибки. */
export function Field({ name, label, error, hint, className, ...inputProps }: FieldProps) {
  const id = `field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...inputProps}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

type PasswordFieldProps = Omit<FieldProps, "type">;

/** Поле пароля с кнопкой «показать / скрыть». */
export function PasswordField({ name, label, error, hint, className, ...inputProps }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = `field-${name}`;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="pr-12"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-1 my-auto flex size-10 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  );
}

function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-sm font-semibold text-destructive">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {hint}
      </p>
    );
  }
  return null;
}

/** Общая ошибка формы (например, «неверный пароль»). */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-destructive-soft px-4 py-3 text-sm font-semibold text-destructive"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

/** Ставит курсор в первое поле с ошибкой. */
export function focusFirstError(form: HTMLFormElement, errors: Partial<Record<string, string>>) {
  const first = Object.keys(errors)[0];
  if (!first) return;
  const element = form.elements.namedItem(first);
  if (element instanceof HTMLElement) {
    element.focus();
  }
}
