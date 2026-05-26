"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getPresetDateRanges, formatDateForAPI } from "@/lib/utils/dateRange";

interface DateRangeSelectorProps {
  dateFrom: Date;
  dateTo: Date;
  onChange: (dateFrom: Date, dateTo: Date) => void;
  className?: string;
}

export function DateRangeSelector({
  dateFrom,
  dateTo,
  onChange,
  className,
}: DateRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>(dateFrom);
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>(dateTo);

  // Sync state with props when popover opens or props change
  useEffect(() => {
    if (isOpen) {
      setCustomDateFrom(dateFrom);
      setCustomDateTo(dateTo);
    }
  }, [dateFrom, dateTo, isOpen]);

  const handleSelectFrom = (date: Date | undefined) => {
    setCustomDateFrom(date);
    if (date && customDateTo && date > customDateTo) {
      setCustomDateTo(undefined);
    }
  };

  const handleSelectTo = (date: Date | undefined) => {
    setCustomDateTo(date);
    if (date && customDateFrom && date < customDateFrom) {
      setCustomDateFrom(undefined);
    }
  };

  const presets = getPresetDateRanges();

  const rangeModifiers = {
    range: (date: Date) => {
      if (!customDateFrom || !customDateTo) return false;
      const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const from = new Date(customDateFrom.getFullYear(), customDateFrom.getMonth(), customDateFrom.getDate());
      const to = new Date(customDateTo.getFullYear(), customDateTo.getMonth(), customDateTo.getDate());
      return d > from && d < to;
    },
    rangeStart: (date: Date) => {
      if (!customDateFrom) return false;
      const isStart = date.toDateString() === customDateFrom.toDateString();
      const isEnd = customDateTo ? date.toDateString() === customDateTo.toDateString() : false;
      return isStart && !isEnd;
    },
    rangeEnd: (date: Date) => {
      if (!customDateTo) return false;
      const isStart = customDateFrom ? date.toDateString() === customDateFrom.toDateString() : false;
      const isEnd = date.toDateString() === customDateTo.toDateString();
      return isEnd && !isStart;
    }
  };

  const rangeModifiersClassNames = {
    range: "bg-accent text-accent-foreground rounded-none",
    rangeStart: "bg-primary text-primary-foreground font-semibold rounded-l-md rounded-r-none",
    rangeEnd: "bg-primary text-primary-foreground font-semibold rounded-r-md rounded-l-none",
  };

  const handlePresetClick = (preset: { dateFrom: Date; dateTo: Date }) => {
    onChange(preset.dateFrom, preset.dateTo);
  };

  const handleCustomApply = () => {
    if (customDateFrom && customDateTo) {
      onChange(customDateFrom, customDateTo);
      setIsOpen(false);
    }
  };

  const isCurrentRange = (preset: { dateFrom: Date; dateTo: Date }) => {
    return (
      formatDateForAPI(preset.dateFrom) === formatDateForAPI(dateFrom) &&
      formatDateForAPI(preset.dateTo) === formatDateForAPI(dateTo)
    );
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Preset Buttons */}
      {presets.slice(0, 5).map((preset, index) => (
        <Button
          key={index}
          variant={isCurrentRange(preset) ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(preset)}
          className={cn(index >= 3 ? "hidden sm:inline-flex" : "")}
        >
          {preset.label}
        </Button>
      ))}

      {/* Custom Date Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarIcon className="h-4 w-4" />
            Custom
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 max-h-[85vh] overflow-y-auto md:max-h-none md:overflow-y-visible space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">From Date</label>
                <Calendar
                  mode="single"
                  selected={customDateFrom}
                  onSelect={handleSelectFrom}
                  initialFocus
                  disabled={(date) => date > new Date()}
                  modifiers={rangeModifiers}
                  modifiersClassNames={rangeModifiersClassNames}
                  defaultMonth={customDateFrom || new Date()}
                />
              </div>

              <div className="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-4">
                <label className="text-sm font-semibold text-muted-foreground mb-2 block">To Date</label>
                <Calendar
                  mode="single"
                  selected={customDateTo}
                  onSelect={handleSelectTo}
                  disabled={(date) => date > new Date()}
                  modifiers={rangeModifiers}
                  modifiersClassNames={rangeModifiersClassNames}
                  defaultMonth={customDateTo || new Date()}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customDateFrom || !customDateTo}
                className="flex-1 font-semibold"
              >
                Apply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Current Range Display */}
      <div className="text-sm text-muted-foreground w-full sm:w-auto sm:ml-auto mt-1 sm:mt-0 font-medium text-left sm:text-right">
        {format(dateFrom, "MMM dd, yyyy")} - {format(dateTo, "MMM dd, yyyy")}
      </div>
    </div>
  );
}
