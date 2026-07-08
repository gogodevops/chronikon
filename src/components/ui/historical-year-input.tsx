"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { YearEra } from "@/lib/historical-year-fields";

export function HistoricalYearInput({
  year,
  era,
  onYearChange,
  onEraChange,
  placeholder,
}: {
  year: string;
  era: YearEra;
  onYearChange: (value: string) => void;
  onEraChange: (value: YearEra) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex gap-2">
      <Input
        value={year}
        onChange={(e) => onYearChange(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        className="min-w-0 flex-1"
      />
      <Select value={era} onValueChange={(v) => onEraChange(v as YearEra)}>
        <SelectTrigger className="w-[6.5rem] shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ad">n. Chr.</SelectItem>
          <SelectItem value="bc">v. Chr.</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function HistoricalYearRangeFields({
  startLabel,
  endLabel,
  startYear,
  endYear,
  startEra,
  endEra,
  onStartYearChange,
  onEndYearChange,
  onStartEraChange,
  onEndEraChange,
  startPlaceholder = "z. B. 330",
  endPlaceholder = "z. B. 1453",
}: {
  startLabel: string;
  endLabel: string;
  startYear: string;
  endYear: string;
  startEra: YearEra;
  endEra: YearEra;
  onStartYearChange: (value: string) => void;
  onEndYearChange: (value: string) => void;
  onStartEraChange: (value: YearEra) => void;
  onEndEraChange: (value: YearEra) => void;
  startPlaceholder?: string;
  endPlaceholder?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          {startLabel}
        </label>
        <HistoricalYearInput
          year={startYear}
          era={startEra}
          onYearChange={onStartYearChange}
          onEraChange={onStartEraChange}
          placeholder={startPlaceholder}
        />
      </div>
      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          {endLabel}
        </label>
        <HistoricalYearInput
          year={endYear}
          era={endEra}
          onYearChange={onEndYearChange}
          onEraChange={onEndEraChange}
          placeholder={endPlaceholder}
        />
      </div>
    </div>
  );
}
