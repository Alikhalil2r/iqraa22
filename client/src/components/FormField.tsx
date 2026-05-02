import React from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
  error?: string
  className?: string
}

export function FormField({ label, required, children, hint, error, className = '' }: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-bold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export function Input({ className = '', ...props }: InputProps) {
  return <input className={`input-field ${className}`} {...props}/>
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}
export function Select({ options, placeholder, className = '', ...props }: SelectProps) {
  return (
    <select className={`input-field ${className}`} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
export function Textarea({ className = '', ...props }: TextareaProps) {
  return <textarea className={`input-field min-h-[100px] resize-none ${className}`} {...props}/>
}
