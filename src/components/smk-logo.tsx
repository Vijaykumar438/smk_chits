import React from "react";

interface SMKLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function SMKLogo({ size = 48, className = "", showText = true }: SMKLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield shape */}
        <path
          d="M60 8L108 28V62C108 88 88 108 60 116C32 108 12 88 12 62V28L60 8Z"
          fill="#1B5E20"
          stroke="#D4A843"
          strokeWidth="3"
        />
        {/* Inner gold circle */}
        <circle cx="60" cy="58" r="38" fill="none" stroke="#D4A843" strokeWidth="2" />
        {/* SMK Text */}
        <text
          x="60"
          y="50"
          textAnchor="middle"
          fontFamily="Georgia, serif"
          fontSize="28"
          fontWeight="bold"
          fill="#D4A843"
          letterSpacing="2"
        >
          SMK
        </text>
        {/* CHITS Text */}
        <text
          x="60"
          y="72"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontSize="13"
          fontWeight="600"
          fill="#FFFDF5"
          letterSpacing="4"
        >
          CHITS
        </text>
        {/* Telugu text */}
        <text
          x="60"
          y="90"
          textAnchor="middle"
          fontFamily="Noto Sans Telugu, sans-serif"
          fontSize="10"
          fill="#D4A843"
          opacity="0.85"
        >
          ఎస్ఎంకె చిట్స్
        </text>
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-smk-green tracking-wide">
            SMK CHITS
          </span>
          <span className="text-xs text-smk-gold font-medium">
            ఎస్ఎంకె చిట్స్
          </span>
        </div>
      )}
    </div>
  );
}

export function SMKLogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M60 8L108 28V62C108 88 88 108 60 116C32 108 12 88 12 62V28L60 8Z"
        fill="#1B5E20"
        stroke="#D4A843"
        strokeWidth="3"
      />
      <circle cx="60" cy="58" r="38" fill="none" stroke="#D4A843" strokeWidth="2" />
      <text
        x="60"
        y="50"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="28"
        fontWeight="bold"
        fill="#D4A843"
        letterSpacing="2"
      >
        SMK
      </text>
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontSize="13"
        fontWeight="600"
        fill="#FFFDF5"
        letterSpacing="4"
      >
        CHITS
      </text>
    </svg>
  );
}
