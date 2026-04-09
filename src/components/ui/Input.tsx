import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-white/70 mb-1.5">
          {label}
        </span>
      )}
      <input
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
          placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
          focus:border-emerald-500/50 transition-all ${className}`}
        {...props}
      />
    </label>
  )
}

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export function TextArea({ label, className = '', ...props }: TextAreaProps) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-medium text-white/70 mb-1.5">
          {label}
        </span>
      )}
      <textarea
        className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white
          placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50
          focus:border-emerald-500/50 transition-all resize-none ${className}`}
        {...props}
      />
    </label>
  )
}
