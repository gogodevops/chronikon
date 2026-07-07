"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CopyTextButton({
  label,
  text,
  className,
  size = "sm",
}: {
  label: string;
  text: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Kopieren fehlgeschlagen");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("gap-1.5", className)}
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {copied ? "Kopiert!" : label}
    </Button>
  );
}
