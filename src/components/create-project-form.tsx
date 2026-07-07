"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { createProject } from "@/actions/projects";
import { ProjectIconPicker } from "@/components/project-icon-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_PROJECT_ICON } from "@/lib/project-icons";
import { slugify } from "@/lib/slug";

type CreateProjectFormProps = {
  onSuccess?: (slug: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
};

export function CreateProjectForm({
  onSuccess,
  onCancel,
  submitLabel = "Ober-Thema anlegen",
}: CreateProjectFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [icon, setIcon] = React.useState<string>(DEFAULT_PROJECT_ICON);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await createProject({
      name: name.trim(),
      slug: slug.trim() || slugify(name),
      icon: icon.trim() || DEFAULT_PROJECT_ICON,
    });

    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (onSuccess) {
      onSuccess(result.data.slug);
    } else {
      router.push(`/p/${result.data.slug}/dashboard`);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Frühes Christentum / Bibel"
          required
          maxLength={120}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          Kurz-URL (Slug)
        </label>
        <Input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="fruehes-christentum"
          required
          maxLength={60}
          pattern="[a-z0-9-]+"
          title="Nur Kleinbuchstaben, Zahlen und Bindestriche"
        />
        <p className="mt-1 text-[0.75rem] text-muted-foreground">
          Erreichbar unter /p/{slug || "…"}
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[0.72rem] uppercase tracking-wide text-muted-foreground">
          Symbol
        </label>
        <ProjectIconPicker value={icon} onChange={setIcon} />
        <p className="mt-2 text-[0.68rem] text-muted-foreground">
          Gewählt: <span className="text-lg leading-none">{icon}</span>
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Abbrechen
          </Button>
        )}
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "Wird angelegt…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
