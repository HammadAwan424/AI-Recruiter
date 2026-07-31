import React, { useEffect, useState } from "react";
import logo from "../../../images/logo.png";
import { CircuitBackground } from "../CircuitBackground";

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        onFinish();
      }, 1000);
    }, 4500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-opacity duration-1000 ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <CircuitBackground />
      <div className="absolute inset-0 bg-gradient-to-br from-[#1F1F1F]/90 via-[#1F1F1F]/80 to-[#1F1F1F]/90" />
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="flex items-center justify-center w-40 h-40 rounded-full bg-black/20 backdrop-blur-xl shadow-[0_0_160px_rgba(0,255,170,1)]">
          <img src={logo} alt="Agentra Logo" className="w-28 object-contain" />
        </div>
      </div>
    </div>
  );
};
