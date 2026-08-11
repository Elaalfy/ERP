import type { InputHTMLAttributes } from 'react';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Field({ label, className = '', ...props }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm text-gray-700">
      <span className="font-medium">{label}</span>
      <input
        className={`border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
        {...props}
      />
    </label>
  );
}
