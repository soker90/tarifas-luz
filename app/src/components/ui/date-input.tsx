import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DateInputProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

// Mask: DD/MM/AAAA  → display length 10
// Display positions: 0 1 / 3 4 / 6 7 8 9
const DIGIT_POSITIONS = [0, 1, 3, 4, 6, 7, 8, 9]; // indices in display string

function buildDisplay(digits: string[]): string {
  return `${digits[0]}${digits[1]}/${digits[2]}${digits[3]}/${digits[4]}${digits[5]}${digits[6]}${digits[7]}`;
}

function storedToDigits(stored: string): string[] {
  if (!stored || stored.length < 10) return Array(8).fill("_");
  const parts = stored.split("-");
  if (parts.length !== 3) return Array(8).fill("_");
  const [y, m, d] = parts;
  // Reorder to DDMMYYYY
  return `${d}${m}${y}`.split("");
}

function digitsToStored(digits: string[]): string {
  if (digits.includes("_")) return "";
  const d = digits.slice(0, 2).join("");
  const m = digits.slice(2, 4).join("");
  const y = digits.slice(4, 8).join("");
  return `${y}-${m}-${d}`;
}

export function DateInput({ value, onChange, className, id }: DateInputProps) {
  const [digits, setDigits] = useState<string[]>(() => storedToDigits(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDigits(storedToDigits(value));
  }, [value]);

  const setCursor = (pos: number) => {
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const cursor = inputRef.current?.selectionStart ?? 0;

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      // Find first digit slot at or after cursor
      const idx = DIGIT_POSITIONS.findIndex((p) => p >= cursor);
      if (idx === -1) return;
      const newDigits = [...digits];
      newDigits[idx] = e.key;
      setDigits(newDigits);
      onChange(digitsToStored(newDigits));
      // Advance cursor to next digit slot (or after last)
      const nextPos = DIGIT_POSITIONS[idx + 1] ?? DIGIT_POSITIONS[7] + 1;
      setCursor(nextPos);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      // Find last digit slot strictly before cursor
      let targetIdx = -1;
      for (let i = 0; i < DIGIT_POSITIONS.length; i++) {
        if (DIGIT_POSITIONS[i] < cursor) targetIdx = i;
      }
      if (targetIdx === -1) return;
      const newDigits = [...digits];
      newDigits[targetIdx] = "_";
      setDigits(newDigits);
      onChange(digitsToStored(newDigits));
      setCursor(DIGIT_POSITIONS[targetIdx]);
    } else if (e.key === "Delete") {
      e.preventDefault();
      // Clear digit at or after cursor
      const idx = DIGIT_POSITIONS.findIndex((p) => p >= cursor);
      if (idx === -1) return;
      const newDigits = [...digits];
      newDigits[idx] = "_";
      setDigits(newDigits);
      onChange(digitsToStored(newDigits));
      setCursor(DIGIT_POSITIONS[idx]);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      // Jump to previous digit slot
      const idx = [...DIGIT_POSITIONS].reverse().findIndex((p) => p < cursor);
      if (idx !== -1) setCursor(DIGIT_POSITIONS[7 - idx]);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      // Jump to next digit slot
      const idx = DIGIT_POSITIONS.findIndex((p) => p > cursor);
      if (idx !== -1) setCursor(DIGIT_POSITIONS[idx]);
    } else if (e.key !== "Tab") {
      e.preventDefault(); // Block everything else
    }
  };

  const handleClick = () => {
    const cursor = inputRef.current?.selectionStart ?? 0;
    // Snap to nearest digit position
    const nearest = DIGIT_POSITIONS.reduce((prev, curr) =>
      Math.abs(curr - cursor) < Math.abs(prev - cursor) ? curr : prev,
    );
    setCursor(nearest);
  };

  const handleFocus = () => {
    // Jump to first empty slot, or start if all full
    const firstEmpty = digits.findIndex((d) => d === "_");
    setCursor(firstEmpty === -1 ? 0 : DIGIT_POSITIONS[firstEmpty]);
  };

  return (
    <input
      ref={inputRef}
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      id={id}
      inputMode="numeric"
      onChange={() => {}} // controlled via onKeyDown
      onClick={handleClick}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      type="text"
      value={buildDisplay(digits)}
    />
  );
}
