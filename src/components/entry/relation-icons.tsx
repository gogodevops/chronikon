import {
  AlertTriangle,
  BookOpen,
  Clock,
  Crown,
  FileText,
  Globe,
  Link2,
  MapPin,
  MessageCircle,
  Quote,
  ScrollText,
  User,
  type LucideIcon,
} from "lucide-react";
import type { RelationType } from "@prisma/client";

export const RELATION_ICONS: Record<RelationType, LucideIcon> = {
  found_at: MapPin,
  discovered_in: Globe,
  edited_in: FileText,
  discussed_in: MessageCircle,
  translated_in: ScrollText,
  located_at: MapPin,
  authored: User,
  associated_with: Link2,
  founded: Crown,
  ruled_in: Crown,
  contemporary: Clock,
  based_on: BookOpen,
  discusses: MessageCircle,
  cited_in: Quote,
  contradicts: AlertTriangle,
};

export function RelationTypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon = RELATION_ICONS[type as RelationType] ?? Link2;
  return <Icon className={className} strokeWidth={2} />;
}
