"use client";

import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useRef,
} from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  length?: number;
  disabled?: boolean;
  id?: string;
};

export function OtpBoxes({
  value,
  onChange,
  length = 6,
  disabled,
  id = "otp",
}: Props) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (value.length === 0) refs.current[0]?.focus();
  }, [value.length]);

  function setAt(index: number, char: string) {
    const clean = char.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === index ? clean : d));
    const joined = next.join("").slice(0, length);
    onChange(joined);
    if (clean && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  function onKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, "");
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      refs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      refs.current[index + 1]?.focus();
    }
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    const focusAt = Math.min(pasted.length, length - 1);
    refs.current[focusAt]?.focus();
  }

  return (
    <div className="cms-otp" role="group" aria-label="6-digit verification code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={i === 0 ? id : undefined}
          className="cms-otp__cell"
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => setAt(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.currentTarget.select()}
        />
      ))}
    </div>
  );
}
