"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface KiReviewCheck {
  id: string;
  title: string;
  text: string;
  detail?: string;
}

export interface KiReviewModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  entryTitle?: string;
  checks?: KiReviewCheck[];
  onApply?: (checkId: string) => void;
  onDismiss?: (checkId: string) => void;
  onClose?: () => void;
}

export function KiReviewModal({
  open = false,
  onOpenChange,
  entryTitle,
  checks = [],
  onApply,
  onDismiss,
  onClose,
}: KiReviewModalProps) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) setDismissed(new Set());
  }, [open]);

  const visibleChecks = checks.filter((c) => !dismissed.has(c.id));

  const handleApply = (checkId: string) => {
    onApply?.(checkId);
    setDismissed((prev) => new Set(prev).add(checkId));
  };

  const handleDismiss = (checkId: string) => {
    onDismiss?.(checkId);
    setDismissed((prev) => new Set(prev).add(checkId));
  };

  const handleClose = () => {
    onOpenChange?.(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>KI-Prüfung — Passt das zum Projekt?</DialogTitle>
          {entryTitle && (
            <DialogDescription>
              Vorschläge für „{entryTitle}"
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-2.5">
          {visibleChecks.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {checks.length === 0
                ? "Keine Vorschläge — der Eintrag passt zum Projekt."
                : "Alle Vorschläge bearbeitet."}
            </p>
          ) : (
            visibleChecks.map((check) => (
              <div
                key={check.id}
                className="rounded-lg border border-border bg-surface-2 p-3.5"
              >
                <h4 className="mb-1 text-[0.85rem] font-semibold">
                  {check.title}
                </h4>
                <p
                  className="text-[0.82rem] leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: check.text }}
                />
                {check.detail && (
                  <p className="mt-1.5 text-[0.72rem] text-muted-foreground">
                    {check.detail}
                  </p>
                )}
                <div className="mt-2.5 flex gap-2">
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => handleApply(check.id)}
                  >
                    Übernehmen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismiss(check.id)}
                  >
                    Ignorieren
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
