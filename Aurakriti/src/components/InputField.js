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
        return <Mail className="h-4 w-4 text-[#9BA3AF]" />;
      case 'password':
        return <Lock className="h-4 w-4 text-[#9BA3AF]" />;
      case 'user':
        return <User className="h-4 w-4 text-[#9BA3AF]" />;
      case 'shield':
        return <Shield className="h-4 w-4 text-[#9BA3AF]" />;
      default:
        return null;
    }
  };

  const inputType = showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0B0F17]">
          {label}
        </label>
      )}
      <div className="relative">
        {getIcon() && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            {getIcon()}
          </div>
        )}
        <input
          ref={ref}
          type={inputType}
          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm text-[#0B0F17] placeholder:text-[#9BA3AF] transition focus:outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] ${
            getIcon() ? 'pl-10' : ''
          } ${showPasswordToggle ? 'pr-10' : ''} ${
            error ? 'border-[#BE123C]' : 'border-[#EAE6DF]'
          } bg-white shadow-xs`}
          placeholder={placeholder}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9BA3AF] hover:text-[#0B0F17]"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-[#BE123C] font-medium mt-1">{error}</p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';

export default InputField;
