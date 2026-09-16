"use client";

import {
  ClipboardEvent,
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
} from "react";

const OTP_LENGTH = 6;

type OtpDigitInputProps = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

function sanitizeDigits(raw: string) {
  return raw.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function OtpDigitInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: OtpDigitInputProps) {
  const labelId = useId();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const firstEmpty = Math.min(value.length, OTP_LENGTH - 1);
    refs.current[firstEmpty]?.focus();
  }, [autoFocus, disabled, value.length]);

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  }

  function writeAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join("").slice(0, OTP_LENGTH));
  }

  function handleChange(index: number, raw: string) {
    const cleaned = sanitizeDigits(raw);
    if (!cleaned) {
      writeAt(index, "");
      return;
    }

    if (cleaned.length > 1) {
      // Paste / autofill into one box
      const merged = sanitizeDigits(
        value.slice(0, index) + cleaned + value.slice(index + 1),
      );
      onChange(merged);
      focusIndex(Math.min(merged.length, OTP_LENGTH - 1));
      return;
    }

    writeAt(index, cleaned);
    if (index < OTP_LENGTH - 1) focusIndex(index + 1);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (digits[index]) {
        writeAt(index, "");
        return;
      }
      if (index > 0) {
        writeAt(index - 1, "");
        focusIndex(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusIndex(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = sanitizeDigits(event.clipboardData.getData("text"));
    if (!pasted) return;
    onChange(pasted);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className="flex w-full justify-between gap-2 sm:gap-3"
    >
      <span id={labelId} className="sr-only">
        6-digit verification code
      </span>
      {digits.map((digit, index) => {
        const filled = digit !== "";
        const isActiveSlot = index === Math.min(value.length, OTP_LENGTH - 1);

        return (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={6}
            disabled={disabled}
            value={digit}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.currentTarget.select()}
            className={`otp-pixel-cell ${filled ? "is-filled" : ""} ${
              isActiveSlot ? "is-active" : ""
            }`}
          />
        );
      })}
    </div>
  );
}

export { OTP_LENGTH };
