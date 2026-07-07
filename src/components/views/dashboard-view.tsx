"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Sparkles,
} from "lucide-react";

import { ActivityFeed } from "@/components/activity-feed";
import { ViewFrame } from "@/components/ui/chronikon-shell";
import { TYPE_META } from "@/lib/constants";
import type { ActivityPageResult, DashboardStats } from "@/lib/queries";
import { cn } from "@/lib/utils";

export function DashboardView({
  stats,
  activityPage,
  projectSlug,
}: {
  stats: DashboardStats;
  activityPage: ActivityPageResult;
  projectSlug: string;
}) {
  const { items: activity, page, total, totalPages, pageSize } = activityPage;
  const pageHref = (p: number) => `/p/${projectSlug}/dashboard?page=${p}`;
  return (
    <ViewFrame
      eyebrow="Projektübersicht"
      title="Dashboard"
      description="Kennzahlen und Team-Aktivität auf einen Blick."
      maxWidth="full"
      fixedBody
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-3">
        <div className="mb-3 grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4">
          <KpiCard
            label="Einträge gesamt"
            value={stats.totalEntries}
            icon={FileText}
            color="var(--blue)"
          />
          <KpiCard
            label="Offene Fragen"
            value={stats.openQuestions}
            icon={HelpCircle}
            color="var(--orange)"
            accent
          />
          <KpiCard
            label="Gesichert"
            value={stats.verifiedCount}
            icon={CheckCircle2}
            color="var(--green)"
          />
          <KpiCard
            label="Streitig"
            value={stats.disputedCount}
            icon={AlertTriangle}
            color="var(--red)"
          />
        </div>

        <Link
          href={`/p/${projectSlug}/export`}
          className="mb-3 flex shrink-0 items-center gap-3 rounded-xl border border-accent/25 bg-accent-dim/30 px-4 py-3 transition-colors hover:border-accent/40"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-surface text-accent">
            <Archive className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.82rem] font-medium">Export & Online-KI</p>
            <p className="text-[0.68rem] text-muted-foreground">
              Projekt als ZIP — Vorlagen für ChatGPT & Co.
            </p>
          </div>
        </Link>

        <div className="grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-5">
          <section className="flex min-h-0 flex-col overflow-hidden lg:col-span-3">
            <SectionCard
              title="Neu im Projekt"
              subtitle={
                total > 0
                  ? `${total} Aktivitäten · Seite ${page} von ${totalPages}`
                  : "Team-Feed"
              }
              icon={Sparkles}
              scroll
              footer={
                totalPages > 1 ? (
                  <ActivityPagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={pageSize}
                    hrefForPage={pageHref}
                  />
                ) : undefined
              }
            >
              <ActivityFeed items={activity} projectSlug={projectSlug} compact />
            </SectionCard>
          </section>

          <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto lg:col-span-2">
            <SectionCard title="Nach Typ" subtitle="Verteilung">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.byType).map(([type, count]) => {
                  const meta = TYPE_META[type as keyof typeof TYPE_META];
                  return (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem]"
                      style={{
                        borderColor: `${meta?.color ?? "#888"}33`,
                        background: `color-mix(in srgb, ${meta?.color ?? "#888"} 10%, transparent)`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: meta?.color ?? "#888" }}
                      />
                      {meta?.label ?? type}
                      <span className="font-semibold tabular-nums">{count}</span>
                    </span>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Zuletzt bearbeitet" subtitle="Einträge">
              <ul className="space-y-1">
                {stats.recentEntries.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/p/${projectSlug}?entry=${e.id}`}
                      className="flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 transition-colors hover:border-border hover:bg-surface-3"
                    >
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: e.typeColor }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[0.8rem] font-medium">
                          {e.title}
                        </p>
                        <p className="text-[0.65rem] text-muted-foreground">
                          {e.typeLabel}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionCard>
          </aside>
        </div>
      </div>
    </ViewFrame>
  );
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  scroll,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
  scroll?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={
        scroll
          ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface-2/80"
          : "shrink-0 rounded-xl border border-border bg-surface-2/80"
      }
    >
      <div className="shrink-0 border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-surface-3 text-accent">
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
          )}
          <div>
            <h3 className="text-[0.82rem] font-semibold">{title}</h3>
            {subtitle && (
              <p className="text-[0.68rem] text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
      <div
        className={
          scroll
            ? "min-h-0 flex-1 overflow-y-auto px-4 py-3"
            : "px-4 py-3"
        }
      >
        {children}
      </div>
      {footer && (
        <div className="shrink-0 border-t border-border/50 px-4 py-2.5">
          {footer}
        </div>
      )}
    </div>
  );
}

function ActivityPagination({
  page,
  totalPages,
  total,
  pageSize,
  hrefForPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  hrefForPage: (page: number) => string;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pageNumbers = React.useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, startPage + maxButtons - 1);
    startPage = Math.max(1, endPage - maxButtons + 1);
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i,
    );
  }, [page, totalPages]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-[0.68rem] tabular-nums text-muted-foreground">
        {start}–{end} von {total}
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={hrefForPage(page - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/80 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            title="Vorherige Seite"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 text-muted-foreground/40">
            <ChevronLeft className="h-3.5 w-3.5" />
          </span>
        )}

        {pageNumbers.map((n) => (
          <Link
            key={n}
            href={hrefForPage(n)}
            className={cn(
              "flex h-7 min-w-7 items-center justify-center rounded-md px-1.5 text-[0.72rem] font-medium tabular-nums transition-colors",
              n === page
                ? "bg-accent-dim text-accent"
                : "border border-border/80 text-muted-foreground hover:border-accent/40 hover:text-foreground",
            )}
          >
            {n}
          </Link>
        ))}

        {page < totalPages ? (
          <Link
            href={hrefForPage(page + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/80 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
            title="Nächste Seite"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border/40 text-muted-foreground/40">
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
  accent?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface-2 px-3 py-2.5">
      <div
        className="pointer-events-none absolute -right-2 -top-2 h-12 w-12 rounded-full opacity-[0.07]"
        style={{ background: color }}
      />
      <div className="relative flex items-center justify-between gap-2">
        <div>
          <p className="text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={`mt-0.5 text-2xl font-bold tabular-nums tracking-tight ${
              accent ? "text-accent" : ""
            }`}
          >
            {value}
          </p>
        </div>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-3"
          style={{ color }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        </span>
      </div>
    </div>
  );
}
