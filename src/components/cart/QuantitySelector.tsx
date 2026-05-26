"use client";

import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuantitySelectorProps {
  quantity: number;
  min?: number;
  max: number;
  onChange: (quantity: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export function QuantitySelector({
  quantity,
  min = 1,
  max,
  onChange,
  disabled = false,
  size = "md",
}: QuantitySelectorProps) {
  const [value, setValue] = useState(quantity.toString());

  useEffect(() => {
    setValue(quantity.toString());
  }, [quantity]);

  const handleDecrement = () => {
    const newQuantity = Math.max(min, quantity - 1);
    onChange(newQuantity);
  };

  const handleIncrement = () => {
    const newQuantity = Math.min(max, quantity + 1);
    onChange(newQuantity);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input for better UX
    if (inputValue === "") {
      setValue("");
      return;
    }

    // Only allow numbers
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) return;

    setValue(inputValue);
  };

  const handleInputBlur = () => {
    let numValue = parseInt(value, 10);

    // Handle invalid or empty input
    if (isNaN(numValue) || value === "") {
      setValue(quantity.toString());
      return;
    }

    // Clamp to min/max
    numValue = Math.max(min, Math.min(max, numValue));

    setValue(numValue.toString());
    if (numValue !== quantity) {
      onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
    }
  };

  const sizeClasses = {
    sm: {
      button: "h-9 w-9 md:h-7 md:w-7",
      input: "h-9 w-12 md:h-7 md:w-12 text-sm",
    },
    md: {
      button: "h-11 w-11 md:h-9 md:w-9",
      input: "h-11 w-14 md:h-9 md:w-14 text-base",
    },
    lg: {
      button: "h-12 w-12 md:h-11 md:w-11",
      input: "h-12 w-16 md:h-11 md:w-16 text-lg",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || quantity <= min}
        className={classes.button}
        type="button"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <Input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`${classes.input} text-center`}
        aria-label="Quantity"
      />

      <Button
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || quantity >= max}
        className={classes.button}
        type="button"
      >
        <Plus className="h-4 w-4" />
      </Button>

      {max > 0 && quantity >= max && (
        <span className="text-xs text-muted-foreground ml-2">Max</span>
      )}
    </div>
  );
}
