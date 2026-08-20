import type { ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Simple left-to-right flow diagram                                   */
/* ------------------------------------------------------------------ */

export const FlowDiagram = ({
  caption,
  children,
}: {
  caption?: string;
  children: ReactNode;
}) => (
  <div className="not-prose my-8 rounded-lg border border-border bg-card p-6">
    <div className="flex flex-col items-stretch gap-4 lg:flex-row lg:items-center">
      {children}
    </div>
    {caption && (
      <div className="mt-6 border-t border-border pt-3 text-sm text-muted-foreground">
        {caption}
      </div>
    )}
  </div>
);

/* `chip` renders a dashed pill under the body text, for something the box
   holds rather than something it does. */
export const FlowBox = ({
  title,
  note,
  chip,
  accent,
  children,
}: {
  title: string;
  note?: string;
  chip?: string;
  accent?: boolean;
  children?: ReactNode;
}) => (
  <div
    className={`flex flex-1 flex-col gap-1.5 rounded-lg border p-4 ${
      accent ? "border-primary bg-primary/5" : "border-border bg-muted/40"
    }`}
  >
    <div
      className={`text-sm font-semibold ${
        accent ? "text-primary" : "text-card-foreground"
      }`}
    >
      {title}
    </div>
    {children && (
      <div className="text-sm leading-snug text-muted-foreground">
        {children}
      </div>
    )}
    {chip && (
      <div className="mt-1 self-start rounded-full border border-dashed border-primary/60 px-2.5 py-1 font-mono text-xs text-primary">
        {chip}
      </div>
    )}
    {note && <div className="pt-1 font-mono text-xs text-primary">{note}</div>}
  </div>
);

export const FlowArrow = ({
  label,
  sublabel,
  accent,
  bidirectional,
}: {
  label?: string;
  sublabel?: string;
  accent?: boolean;
  bidirectional?: boolean;
}) => (
  <div className="flex shrink-0 flex-col items-center gap-1 px-2 py-1 lg:max-w-[7rem]">
    {label && (
      <div
        className={`text-center font-mono text-xs ${
          accent ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </div>
    )}
    <svg
      className={`h-3 w-16 rotate-90 lg:rotate-0 ${
        accent ? "text-primary" : "text-muted-foreground"
      }`}
      viewBox="0 0 64 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M3 6h58" stroke="currentColor" strokeWidth="1.5" />
      <path d="M61 6l-6-5m6 5-6 5" stroke="currentColor" strokeWidth="1.5" />
      {bidirectional && (
        <path d="M3 6l6-5M3 6l6 5" stroke="currentColor" strokeWidth="1.5" />
      )}
    </svg>
    {sublabel && (
      <div className="text-center font-mono text-xs text-muted-foreground">
        {sublabel}
      </div>
    )}
  </div>
);

export const FlowStack = ({
  more,
  children,
}: {
  more?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-1 flex-col gap-2">
    {children}
    {more && (
      <div className="rounded-lg border border-dashed border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
        {more}
      </div>
    )}
  </div>
);

export const FlowStackItem = ({
  label,
  chip,
}: {
  label: string;
  chip?: string;
}) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
    <div className="text-sm font-semibold text-card-foreground">{label}</div>
    {chip && (
      <div className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
        {chip}
      </div>
    )}
  </div>
);
