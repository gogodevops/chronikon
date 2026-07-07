"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { deleteAppUser } from "@/actions/users";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteUserDialog({
  open,
  onOpenChange,
  userId,
  displayName,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  displayName: string;
  onDeleted?: () => void;
}) {
  const [pending, setPending] = React.useState(false);

  const handleDelete = async () => {
    setPending(true);
    try {
      const result = await deleteAppUser(userId);
      if (!result.success) {
        window.alert(result.error ?? "Entfernen fehlgeschlagen");
        return;
      }
      onOpenChange(false);
      onDeleted?.();
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : "Unbekannter Fehler",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Nutzer entfernen
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-left text-[0.85rem]">
              <p>
                Nutzer{" "}
                <strong className="text-foreground">{displayName}</strong>{" "}
                wirklich entfernen?
              </p>
              <p>
                Alle Projekt-Mitgliedschaften, gesendeten Einladungen, Fragen,
                Kommentare und Antworten sowie Sitzungen werden gelöscht.
                Erstellte Einträge und Anhänge bleiben im Projekt erhalten.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={handleDelete}
          >
            {pending ? "Wird entfernt…" : "Entfernen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
