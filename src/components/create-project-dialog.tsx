"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateProjectForm } from "@/components/create-project-form";

type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Ober-Thema</DialogTitle>
          <DialogDescription>
            Lege ein neues Forschungsprojekt an. Du wirst automatisch
            Administrator dieses Projekts.
          </DialogDescription>
        </DialogHeader>
        <CreateProjectForm
          onCancel={() => onOpenChange(false)}
          onSuccess={(slug) => {
            onOpenChange(false);
            window.location.href = `/p/${slug}/dashboard`;
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
