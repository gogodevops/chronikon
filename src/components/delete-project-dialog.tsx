"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";

import { deleteProject } from "@/actions/projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}) {
  const [confirmName, setConfirmName] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const nameMatches =
    confirmName.trim().toLowerCase() === projectName.trim().toLowerCase();

  React.useEffect(() => {
    if (!open) setConfirmName("");
  }, [open]);

  const handleDelete = async () => {
    if (!nameMatches) return;
    setPending(true);
    try {
      const result = await deleteProject(projectId);
      if (!result.success) {
        window.alert(result.error ?? "Löschen fehlgeschlagen");
        return;
      }
      onOpenChange(false);
      window.location.href = result.data.redirectTo;
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
            Ober-Thema löschen
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-left text-[0.85rem]">
              <p>
                <strong className="text-foreground">{projectName}</strong> wird
                unwiderruflich gelöscht.
              </p>
              <p>
                Alle Einträge, Quellen, Team-Daten und Verknüpfungen dieses
                Ober-Themas werden dabei entfernt.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor="delete-project-confirm"
            className="text-[0.78rem] text-muted-foreground"
          >
            Zur Bestätigung den Namen eingeben:{" "}
            <strong className="text-foreground">{projectName}</strong>
          </label>
          <Input
            id="delete-project-confirm"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={projectName}
            autoComplete="off"
            className="h-9"
          />
        </div>

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
            disabled={!nameMatches || pending}
            onClick={handleDelete}
          >
            {pending ? "Wird gelöscht…" : "Endgültig löschen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
