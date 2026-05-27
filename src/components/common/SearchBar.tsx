"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  defaultValue?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search products...",
  defaultValue = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);

  // Sync state with defaultValue (e.g. when search filters are cleared)
  useEffect(() => {
    setQuery(defaultValue);
  }, [defaultValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Button type="submit" className="bg-[#FF6600] hover:bg-[#E65C00] text-white border-none transition-colors duration-200">Search</Button>
    </form>
  );
}
