import { CreateProjectForm } from "@/components/create-project-form";

export default function NewProjectPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8">
        <h1 className="mb-1 text-2xl font-bold text-accent">Chronikon</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Erstes Ober-Thema anlegen
        </p>
        <p className="mb-6 text-[0.85rem] text-muted-foreground">
          Noch kein Projekt vorhanden. Lege dein erstes Forschungsprojekt an, um
          Einträge zu erfassen.
        </p>
        <CreateProjectForm />
      </div>
    </div>
  );
}
