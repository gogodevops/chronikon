"use client";

import * as React from "react";
import {
  BookOpen,
  FileText,
  HelpCircle,
  MapPin,
  MessageSquare,
  User,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export type CommandResultType =
  | "entry"
  | "place"
  | "question"
  | "action";

export interface CommandResult {
  id: string;
  type: CommandResultType;
  title: string;
  subtitle?: string;
  entryId?: string;
}

export interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  results?: CommandResult[];
  onSearch?: (query: string) => void;
  onSelect?: (result: CommandResult) => void;
  recentItems?: CommandResult[];
}

const TYPE_ICONS: Record<CommandResultType, React.ReactNode> = {
  entry: <FileText className="h-4 w-4" />,
  place: <MapPin className="h-4 w-4" />,
  question: <HelpCircle className="h-4 w-4" />,
  action: <BookOpen className="h-4 w-4" />,
};

const DEFAULT_ACTIONS: CommandResult[] = [
  {
    id: "new-entry",
    type: "action",
    title: "Neuen Eintrag erstellen",
    subtitle: "Formular öffnen",
  },
  {
    id: "discussions",
    type: "action",
    title: "Diskussionen anzeigen",
    subtitle: "Alle offenen Fragen",
  },
];

export function CommandPalette({
  open = false,
  onOpenChange,
  results = [],
  onSearch,
  onSelect,
  recentItems = [],
}: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    onSearch?.(query);
  }, [query, onSearch]);

  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const entries = results.filter((r) => r.type === "entry");
  const places = results.filter((r) => r.type === "place");
  const questions = results.filter((r) => r.type === "question");

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Eintrag, Ort, Frage suchen…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>

        {!query && recentItems.length > 0 && (
          <CommandGroup heading="Zuletzt">
            {recentItems.map((item) => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => onSelect?.(item)}
              >
                <span className="text-muted-foreground">
                  {TYPE_ICONS[item.type]}
                </span>
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {item.subtitle && (
                    <span className="text-[0.75rem] text-muted-foreground">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {entries.length > 0 && (
          <CommandGroup heading="Einträge">
            {entries.map((item) => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => onSelect?.(item)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {item.subtitle && (
                    <span className="text-[0.75rem] text-muted-foreground">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {places.length > 0 && (
          <CommandGroup heading="Orte">
            {places.map((item) => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => onSelect?.(item)}
              >
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {questions.length > 0 && (
          <CommandGroup heading="Fragen">
            {questions.map((item) => (
              <CommandItem
                key={item.id}
                value={item.title}
                onSelect={() => onSelect?.(item)}
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span>{item.title}</span>
                  {item.subtitle && (
                    <span className="text-[0.75rem] text-muted-foreground">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        <CommandGroup heading="Aktionen">
          {DEFAULT_ACTIONS.map((item) => (
            <CommandItem
              key={item.id}
              value={item.title}
              onSelect={() => onSelect?.(item)}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{item.title}</span>
                {item.subtitle && (
                  <span className="text-[0.75rem] text-muted-foreground">
                    {item.subtitle}
                  </span>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
