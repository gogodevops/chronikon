"use client";

import { Input } from "@/components/ui/input";
import { HistoricalYearInput } from "@/components/ui/historical-year-input";
import type { YearEra } from "@/lib/historical-year-fields";

function DatePartInput({
  label,
  value,
  onChange,
  placeholder,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  max: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[0.68rem] uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        min={1}
        max={max}
      />
    </div>
  );
}

export function PersonLifeDateFields({
  birthYear,
  birthMonth,
  birthDay,
  birthEra,
  deathYear,
  deathMonth,
  deathDay,
  deathEra,
  onBirthYearChange,
  onBirthMonthChange,
  onBirthDayChange,
  onBirthEraChange,
  onDeathYearChange,
  onDeathMonthChange,
  onDeathDayChange,
  onDeathEraChange,
}: {
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthEra: YearEra;
  deathYear: string;
  deathMonth: string;
  deathDay: string;
  deathEra: YearEra;
  onBirthYearChange: (value: string) => void;
  onBirthMonthChange: (value: string) => void;
  onBirthDayChange: (value: string) => void;
  onBirthEraChange: (value: YearEra) => void;
  onDeathYearChange: (value: string) => void;
  onDeathMonthChange: (value: string) => void;
  onDeathDayChange: (value: string) => void;
  onDeathEraChange: (value: YearEra) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-surface-2/30 p-3">
      <p className="text-[0.72rem] font-medium text-muted-foreground">
        Lebensdaten (optional)
      </p>
      <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
        Jahr, Monat und Tag nach Bedarf — nichts davon ist Pflicht. v. Chr. /
        n. Chr. beim Jahr wählen.
      </p>

      <div className="space-y-2">
        <p className="text-[0.72rem] font-medium text-foreground">Geboren</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-[0.68rem] uppercase tracking-wide text-muted-foreground">
              Jahr
            </label>
            <HistoricalYearInput
              year={birthYear}
              era={birthEra}
              onYearChange={onBirthYearChange}
              onEraChange={onBirthEraChange}
              placeholder="z. B. 1432"
            />
          </div>
          <DatePartInput
            label="Monat"
            value={birthMonth}
            onChange={onBirthMonthChange}
            placeholder="1–12"
            max={12}
          />
          <DatePartInput
            label="Tag"
            value={birthDay}
            onChange={onBirthDayChange}
            placeholder="1–31"
            max={31}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[0.72rem] font-medium text-foreground">Gestorben</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-[0.68rem] uppercase tracking-wide text-muted-foreground">
              Jahr
            </label>
            <HistoricalYearInput
              year={deathYear}
              era={deathEra}
              onYearChange={onDeathYearChange}
              onEraChange={onDeathEraChange}
              placeholder="z. B. 1481"
            />
          </div>
          <DatePartInput
            label="Monat"
            value={deathMonth}
            onChange={onDeathMonthChange}
            placeholder="1–12"
            max={12}
          />
          <DatePartInput
            label="Tag"
            value={deathDay}
            onChange={onDeathDayChange}
            placeholder="1–31"
            max={31}
          />
        </div>
      </div>
    </div>
  );
}
