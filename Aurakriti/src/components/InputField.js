'use client';

import { forwardRef } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';

const InputField = forwardRef(({
  label,
  type = 'text',
  placeholder,
  error,
  icon,
  showPasswordToggle = false,
  onTogglePassword,
  showPassword = false,
  ...props
}, ref) => {
  const getIcon = () => {
    switch (icon) {
      case 'email':
        return <Mail className="h-5 w-5 text-slate-400" />;
      case 'password':
        return <Lock className="h-5 w-5 text-slate-400" />;
      case 'user':
        return <User className="h-5 w-5 text-slate-400" />;
      case 'shield':
        return <Shield className="h-5 w-5 text-slate-400" />;
      default:
        return null;
    }
  };

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-slate-800">
          {label}
        </label>
      )}
      <div className="relative">
        {getIcon() && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {getIcon()}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full rounded-2xl border-2 px-4 py-3 text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-500 ${
            getIcon() ? 'pl-12' : ''
          } ${showPasswordToggle ? 'pr-12' : ''} ${
            error ? 'border-red-300' : 'border-slate-300'
          } bg-white shadow-sm`}
          placeholder={placeholder}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 hover:text-slate-700" />
            ) : (
              <Eye className="h-5 w-5 hover:text-slate-700" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
