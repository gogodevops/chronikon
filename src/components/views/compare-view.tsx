"use client";

export function CompareView({
  title,
  items,
}: {
  title: string;
  items: { label: string; content: string }[];
}) {
  return (
    <div className="p-6">
      <h2 className="mb-2 text-xl font-semibold">{title}</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Übersetzungsvergleich — nebeneinander
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-surface-2 p-4"
          >
            <h3 className="mb-3 border-b border-border pb-2 font-semibold text-accent">
              {item.label}
            </h3>
            <div className="whitespace-pre-wrap text-[0.85rem] leading-relaxed">
              {item.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
