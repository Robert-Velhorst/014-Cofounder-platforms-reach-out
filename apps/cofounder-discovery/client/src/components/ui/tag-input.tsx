import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "./input";
import { Badge } from "./badge";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="bg-gradient-to-r from-orange-500/20 to-purple-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-orange-300"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type and press Enter to add"}
        className="bg-gray-800/50 border-white/10 text-white"
      />
      <p className="text-xs text-gray-500 mt-1">
        Press Enter to add, Backspace to remove last
      </p>
    </div>
  );
}
