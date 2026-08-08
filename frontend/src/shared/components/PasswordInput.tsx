import React, { useState } from "react";
import { TextField, TextFieldProps, IconButton, InputAdornment, InputProps as MuiInputProps } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import { FaLock } from "react-icons/fa";

interface MuiPasswordInputProps extends Omit<TextFieldProps, "type"> {
  variantType?: "mui";
  InputProps?: Partial<MuiInputProps>;
}

interface TailwindPasswordInputProps {
  variantType: "tailwind";
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export type PasswordInputProps = MuiPasswordInputProps | TailwindPasswordInputProps;

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  if (props.variantType === "tailwind") {
    const { name, value, onChange, placeholder, className, icon } = props;
    const hasValue = Boolean(value != null && String(value).length > 0);

    return (
      <div className="flex items-center justify-between gap-2 border-b border-[#05DC7F]/20 pb-2">
        <div className="flex items-center gap-2 flex-1">
          {icon || <FaLock className="text-[#05DC7F] w-5 h-5 shrink-0" />}
          <input
            type={showPassword ? "text" : "password"}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder || "Password"}
            className={className || "w-full bg-transparent text-white placeholder-gray-400 outline-none"}
          />
        </div>
        {hasValue && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-400 hover:text-white p-1 transition shrink-0"
            aria-label="Toggle password visibility"
          >
            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        )}
      </div>
    );
  }

  const { InputProps, ...restMuiProps } = props as MuiPasswordInputProps;
  const rawValue = restMuiProps.value ?? restMuiProps.defaultValue;
  const hasValue = Boolean(rawValue != null && String(rawValue).length > 0);

  return (
    <TextField
      {...(restMuiProps as TextFieldProps)}
      type={showPassword ? "text" : "password"}
      slotProps={{
        input: {
          ...InputProps,
          endAdornment: hasValue ? (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                aria-label="toggle password visibility"
                sx={{ color: "gray" }}
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </IconButton>
            </InputAdornment>
          ) : (
            InputProps?.endAdornment || null
          ),
        },
      }}
    />
  );
};
