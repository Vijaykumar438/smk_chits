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
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Premium green gradient for shield */}
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2E7D32" />
            <stop offset="50%" stopColor="#1B5E20" />
            <stop offset="100%" stopColor="#0D3B13" />
          </linearGradient>
          {/* Gold gradient for border and accents */}
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5D77A" />
            <stop offset="30%" stopColor="#D4A843" />
            <stop offset="60%" stopColor="#E8C96A" />
            <stop offset="100%" stopColor="#C09533" />
          </linearGradient>
          {/* Radial glow behind the center */}
          <radialGradient id="innerGlow" cx="50%" cy="45%" r="35%">
            <stop offset="0%" stopColor="#2E7D32" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1B5E20" stopOpacity="0" />
          </radialGradient>
          {/* Subtle shine on top of shield */}
          <linearGradient id="shineGrad" x1="0%" y1="0%" x2="0%" y2="60%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* Drop shadow */}
          <filter id="dropShadow" x="-10%" y="-5%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.25" />
          </filter>
          {/* Inner shadow for depth */}
          <filter id="innerShadow">
            <feComponentTransfer in="SourceAlpha">
              <feFuncA type="table" tableValues="1 0" />
            </feComponentTransfer>
            <feGaussianBlur stdDeviation="2" />
            <feOffset dx="0" dy="1" result="offsetblur" />
            <feFlood floodColor="#000000" floodOpacity="0.3" result="color" />
            <feComposite in2="offsetblur" operator="in" />
            <feComposite in2="SourceAlpha" operator="in" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode />
            </feMerge>
          </filter>
        </defs>

        {/* Outer shield - premium shape with pointed bottom */}
        <path
          d="M100 10L185 42V90C185 140 152 172 100 192C48 172 15 140 15 90V42L100 10Z"
          fill="url(#shieldGrad)"
          filter="url(#dropShadow)"
        />
        {/* Gold outer border */}
        <path
          d="M100 10L185 42V90C185 140 152 172 100 192C48 172 15 140 15 90V42L100 10Z"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="3.5"
        />
        {/* Inner shield border - creates an inset frame */}
        <path
          d="M100 20L175 48V88C175 134 145 163 100 182C55 163 25 134 25 88V48L100 20Z"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Shine overlay */}
        <path
          d="M100 10L185 42V90C185 140 152 172 100 192C48 172 15 140 15 90V42L100 10Z"
          fill="url(#shineGrad)"
        />
        {/* Inner glow */}
        <circle cx="100" cy="88" r="70" fill="url(#innerGlow)" />

        {/* Decorative gold ring */}
        <ellipse cx="100" cy="88" rx="58" ry="58" fill="none" stroke="url(#goldGrad)" strokeWidth="1.8" />
        <ellipse cx="100" cy="88" rx="54" ry="54" fill="none" stroke="url(#goldGrad)" strokeWidth="0.5" opacity="0.5" />

        {/* Corner ornaments - top left & right filigree scrolls */}
        {/* Top-left flourish */}
        <path
          d="M38 50 C38 46 42 42 46 42 C44 44 43 47 44 49 C45 47 47 46 50 46"
          fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.7"
        />
        {/* Top-right flourish */}
        <path
          d="M162 50 C162 46 158 42 154 42 C156 44 157 47 156 49 C155 47 153 46 150 46"
          fill="none" stroke="url(#goldGrad)" strokeWidth="1" opacity="0.7"
        />
        {/* Small diamond top center */}
        <path d="M100 24L104 30L100 36L96 30Z" fill="url(#goldGrad)" opacity="0.8" />

        {/* Decorative separator line above CHITS */}
        <line x1="68" y1="103" x2="132" y2="103" stroke="url(#goldGrad)" strokeWidth="0.8" />
        {/* Small diamond ornaments on the separator */}
        <circle cx="68" cy="103" r="1.5" fill="url(#goldGrad)" />
        <circle cx="132" cy="103" r="1.5" fill="url(#goldGrad)" />
        <path d="M100 100L103 103L100 106L97 103Z" fill="url(#goldGrad)" />

        {/* "S" Monogram - left */}
        <text
          x="72"
          y="92"
          textAnchor="middle"
          fontFamily="'Georgia', 'Palatino Linotype', 'Times New Roman', serif"
          fontSize="40"
          fontWeight="bold"
          fill="url(#goldGrad)"
          filter="url(#innerShadow)"
          letterSpacing="1"
        >
          S
        </text>
        {/* "M" Monogram - center, slightly larger */}
        <text
          x="100"
          y="92"
          textAnchor="middle"
          fontFamily="'Georgia', 'Palatino Linotype', 'Times New Roman', serif"
          fontSize="44"
          fontWeight="bold"
          fill="url(#goldGrad)"
          filter="url(#innerShadow)"
          letterSpacing="1"
        >
          M
        </text>
        {/* "K" Monogram - right */}
        <text
          x="130"
          y="92"
          textAnchor="middle"
          fontFamily="'Georgia', 'Palatino Linotype', 'Times New Roman', serif"
          fontSize="40"
          fontWeight="bold"
          fill="url(#goldGrad)"
          filter="url(#innerShadow)"
          letterSpacing="1"
        >
          K
        </text>

        {/* "CHITS" text below separator */}
        <text
          x="100"
          y="120"
          textAnchor="middle"
          fontFamily="'Trebuchet MS', 'Arial', sans-serif"
          fontSize="16"
          fontWeight="700"
          fill="#FFFDF5"
          letterSpacing="8"
        >
          CHITS
        </text>

        {/* Telugu text at the bottom curve */}
        <text
          x="100"
          y="144"
          textAnchor="middle"
          fontFamily="'Noto Sans Telugu', sans-serif"
          fontSize="11"
          fill="url(#goldGrad)"
          opacity="0.9"
        >
          ఎస్ ఎం కె చిట్స్
        </text>

        {/* Bottom flourish ornament */}
        <path
          d="M80 155 Q90 160 100 155 Q110 160 120 155"
          fill="none"
          stroke="url(#goldGrad)"
          strokeWidth="1"
          opacity="0.6"
        />
        <circle cx="100" cy="158" r="1.2" fill="url(#goldGrad)" opacity="0.6" />

        {/* Tiny star accents near the ring */}
        <circle cx="56" cy="58" r="1" fill="#F5D77A" opacity="0.7" />
        <circle cx="144" cy="58" r="1" fill="#F5D77A" opacity="0.7" />
        <circle cx="56" cy="118" r="1" fill="#F5D77A" opacity="0.7" />
        <circle cx="144" cy="118" r="1" fill="#F5D77A" opacity="0.7" />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span
            className="text-lg font-bold tracking-[0.15em]"
            style={{
              background: "linear-gradient(135deg, #D4A843 0%, #F5D77A 50%, #C09533 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SMK CHITS
          </span>
          <span className="text-[0.65rem] text-smk-green font-semibold tracking-[0.2em] uppercase">
            Chit Fund Management
          </span>
          <span className="text-[0.6rem] text-smk-gold/80 font-medium">
            ఎస్ ఎం కె చిట్స్
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
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shieldGradMark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2E7D32" />
          <stop offset="50%" stopColor="#1B5E20" />
          <stop offset="100%" stopColor="#0D3B13" />
        </linearGradient>
        <linearGradient id="goldGradMark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5D77A" />
          <stop offset="30%" stopColor="#D4A843" />
          <stop offset="60%" stopColor="#E8C96A" />
          <stop offset="100%" stopColor="#C09533" />
        </linearGradient>
        <linearGradient id="shineGradMark" x1="0%" y1="0%" x2="0%" y2="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="dropShadowMark" x="-10%" y="-5%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.2" />
        </filter>
      </defs>
      {/* Shield */}
      <path
        d="M100 10L185 42V90C185 140 152 172 100 192C48 172 15 140 15 90V42L100 10Z"
        fill="url(#shieldGradMark)"
        filter="url(#dropShadowMark)"
      />
      <path
        d="M100 10L185 42V90C185 140 152 172 100 192C48 172 15 140 15 90V42L100 10Z"
        fill="none"
        stroke="url(#goldGradMark)"
        strokeWidth="3.5"
      />
      <path
        d="M100 10L185 42V90C185 140 152 172 100 192C48 172 15 140 15 90V42L100 10Z"
        fill="url(#shineGradMark)"
      />
      {/* Gold ring */}
      <ellipse cx="100" cy="88" rx="58" ry="58" fill="none" stroke="url(#goldGradMark)" strokeWidth="1.8" />
      {/* SMK */}
      <text
        x="72"
        y="95"
        textAnchor="middle"
        fontFamily="'Georgia', serif"
        fontSize="42"
        fontWeight="bold"
        fill="url(#goldGradMark)"
      >
        S
      </text>
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fontFamily="'Georgia', serif"
        fontSize="46"
        fontWeight="bold"
        fill="url(#goldGradMark)"
      >
        M
      </text>
      <text
        x="130"
        y="95"
        textAnchor="middle"
        fontFamily="'Georgia', serif"
        fontSize="42"
        fontWeight="bold"
        fill="url(#goldGradMark)"
      >
        K
      </text>
      {/* Separator */}
      <line x1="68" y1="105" x2="132" y2="105" stroke="url(#goldGradMark)" strokeWidth="0.8" />
      {/* CHITS */}
      <text
        x="100"
        y="122"
        textAnchor="middle"
        fontFamily="'Trebuchet MS', sans-serif"
        fontSize="16"
        fontWeight="700"
        fill="#FFFDF5"
        letterSpacing="8"
      >
        CHITS
      </text>
    </svg>
  );
}
