import type { LucideIcon } from "lucide-react";
import {
  CircleHelp,
  FilePlus2,
  GitBranch,
  Link2,
  MessageSquare,
  Paperclip,
  Pencil,
  Scale,
} from "lucide-react";

import type { ActivityItem } from "@/lib/queries";

export type ActivityKind = ActivityItem["kind"];

export const ACTIVITY_META: Record<
  ActivityKind,
  { label: string; verb: string; icon: LucideIcon; color: string }
> = {
  entry_created: {
    label: "Neu",
    verb: "hat einen Eintrag erstellt",
    icon: FilePlus2,
    color: "var(--green)",
  },
  entry_edited: {
    label: "Bearbeitet",
    verb: "hat einen Eintrag bearbeitet",
    icon: Pencil,
    color: "var(--blue)",
  },
  question: {
    label: "Frage",
    verb: "hat eine Frage gestellt",
    icon: CircleHelp,
    color: "var(--orange)",
  },
  comment: {
    label: "Kommentar",
    verb: "hat kommentiert",
    icon: MessageSquare,
    color: "var(--cyan)",
  },
  answer: {
    label: "Antwort",
    verb: "hat geantwortet",
    icon: MessageSquare,
    color: "var(--purple)",
  },
  claim: {
    label: "Behauptung",
    verb: "hat eine Behauptung hinzugefügt",
    icon: Scale,
    color: "var(--accent)",
  },
  attachment: {
    label: "Anhang",
    verb: "hat einen Anhang hochgeladen",
    icon: Paperclip,
    color: "var(--blue)",
  },
  relation: {
    label: "Verknüpfung",
    verb: "hat eine Verknüpfung erstellt",
    icon: Link2,
    color: "var(--purple)",
  },
};

export const NOTIFICATION_TYPE_META: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  question: { icon: CircleHelp, color: "var(--orange)" },
  mention: { icon: MessageSquare, color: "var(--cyan)" },
  comment: { icon: MessageSquare, color: "var(--cyan)" },
  entry_created: { icon: FilePlus2, color: "var(--green)" },
  entry_edited: { icon: Pencil, color: "var(--blue)" },
  claim: { icon: Scale, color: "var(--accent)" },
  relation: { icon: GitBranch, color: "var(--purple)" },
  answer: { icon: MessageSquare, color: "var(--purple)" },
};
