interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FloatingInput({ label, error, className = '', ...props }: FloatingInputProps) {
  return (
    <div className="floating-input">
      <input
        {...props}
        placeholder=" "
        className={`${className} ${error ? 'border-red-500!' : ''}`}
        style={error ? { borderColor: 'var(--danger)' } : undefined}
      />
      <label>{label}</label>
      {error && (
        <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}

interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export function FloatingTextarea({ label, error, className = '', ...props }: FloatingTextareaProps) {
  return (
    <div className="floating-input">
      <textarea
        {...props}
        placeholder=" "
        className={`${className} resize-none ${error ? 'border-red-500!' : ''}`}
        style={{ ...(error ? { borderColor: 'var(--danger)' } : {}), minHeight: '100px' }}
      />
      <label>{label}</label>
      {error && (
        <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </div>
  );
}