import React from "react";

interface LoadingButtonProps {
  loading: boolean;
  onClick?: () => void;
  text: string;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  onClick,
  text,
  loadingText = "PROCESSING",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="relative w-full sm:w-auto min-w-[140px] h-[44px] mx-auto flex items-center justify-center border border-[#05DC7F] text-[#05DC7F] rounded-[14px] hover:bg-[#05DC7F] hover:text-black transition overflow-hidden disabled:cursor-not-allowed group"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <span className="text-[#05DC7F] text-xs font-mono tracking-widest">
            {loadingText}
          </span>
          <div className="flex items-center gap-[4px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="block w-[5px] h-[5px] rounded-full bg-[#05DC7F] animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <span className="font-semibold tracking-widest">{text}</span>
      )}
    </button>
  );
};
