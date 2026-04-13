import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";

interface OtpInputProps {
  value: string;
  onChange: (val: string) => void;
  onComplete: (val: string) => void;
  error?: boolean;
  dark?: boolean;
}

const OtpInput = ({ value, onChange, onComplete, error, dark }: OtpInputProps) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const digits = value.padEnd(6, "").slice(0, 6).split("");

  const handleChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const next = [...digits];
    next[idx] = char;
    const joined = next.join("");
    onChange(joined.replace(/ /g, ""));
    if (char && idx < 5) {
      refs.current[idx + 1]?.focus();
    }
    if (char && idx === 5 && joined.length === 6) {
      onComplete(joined);
    }
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      onChange(pasted);
      if (pasted.length === 6) onComplete(pasted);
      refs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const borderColor = error
    ? "border-red-500"
    : dark
      ? "border-[rgba(134,163,131,0.3)]"
      : "border-gray-200";

  const bgColor = dark ? "bg-[rgba(249,247,242,0.06)]" : "bg-white";
  const textColor = dark ? "text-[#F9F7F2]" : "text-foreground";

  return (
    <div className="flex justify-center gap-2">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={`w-12 h-14 text-center text-[28px] font-semibold rounded-xl border ${borderColor} ${bgColor} ${textColor} outline-none focus:ring-2 focus:ring-primary`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
};

export default OtpInput;
