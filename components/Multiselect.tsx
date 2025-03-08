"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandItem } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";

interface MultiSelectProps {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({ options, value, onChange, placeholder }: MultiSelectProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  React.useEffect(() => {
    console.log("MultiSelect received options:", options);
    console.log("MultiSelect received value:", value);
  }, [options, value]);

  // Find the selected options from our options array
  // Filter out any undefined to handle missing options
  const selectedOptions = value.map((v) => options.find((option) => option.value === v)).filter((opt): opt is { value: string; label: string } => opt !== undefined);

  console.log("MultiSelect processed selectedOptions:", selectedOptions);

  // Handle unselecting an option
  const handleUnselect = (option: { value: string; label: string }) => {
    console.log("Unselecting option:", option);
    const newValue = value.filter((v) => v !== option.value);
    console.log("New value after unselect:", newValue);
    onChange(newValue);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = inputRef.current;
    if (input) {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (input.value === "" && value.length > 0) {
          const newValue = [...value];
          newValue.pop();
          onChange(newValue);
        }
      }
      // Close dropdown on Escape
      if (e.key === "Escape") {
        input.blur();
      }
    }
  };

  // Filter options that haven't been selected yet
  const selectableOptions = options.filter((option) => !value.includes(option.value));

  // Filter options based on input text
  const filteredOptions = selectableOptions.filter((option) => option.label.toLowerCase().includes(inputValue.toLowerCase()));

  console.log("Filterable options:", filteredOptions);

  return (
    <Command onKeyDown={handleKeyDown} className="overflow-visible bg-white">
      <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <div className="flex gap-1 flex-wrap bg-[#fff] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform">
          {selectedOptions.map((option) => (
            <Badge key={option.value} variant="default" className="bg-yellow-200 text-black">
              {option.label}
              <button
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(option);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={() => handleUnselect(option)}
              >
                <X className="h-3 w-3 text-black hover:text-red-500" />
              </button>
            </Badge>
          ))}
          <CommandPrimitive.Input
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => {
              setTimeout(() => setOpen(false), 200); // Slight delay to allow click events
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder || `${selectedOptions.length ? "Add more..." : "Select options..."}`}
            className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {filteredOptions.map((option) => (
          <CommandItem
            key={option.value}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onSelect={() => {
              // Skip selection if the option is disabled
              if (option.disabled) return;

              setInputValue("");
              const newValue = [...value, option.value];
              console.log("Adding option to selection:", option);
              console.log("New value after add:", newValue);
              onChange(newValue);
            }}
            className={`cursor-pointer hover:bg-yellow-100 ${option.disabled ? "opacity-50 text-gray-500 line-through" : ""}`}
            disabled={option.disabled}
          >
            {option.label}
            {option.disabled && <span className="ml-2 text-xs text-red-500">(Sudah dalam promosi)</span>}
          </CommandItem>
        ))}
        {open && filteredOptions.length === 0 && inputValue && (
          <div className="bg-[#fff] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
            <div className="py-6 text-center text-sm">No options found</div>
          </div>
        )}
      </div>
    </Command>
  );
}
