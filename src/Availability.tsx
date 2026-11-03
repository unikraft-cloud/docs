import type { ReactNode } from "react";
import { Link } from "zudoku/components";
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  ClockIcon,
} from "zudoku/icons";

/* A hosting or interface entry is available, not available, coming soon, or
   available with a difference that the notes explain. */
export type Mark = boolean | "soon" | "differs";

export type AvailabilitySpec = {
  hosting?: { cloud?: Mark; byoc?: Mark; "on-prem"?: Mark };
  plan?: "all" | "enterprise";
  status?: "ga" | "preview" | "coming-soon";
  interfaces?: { api?: Mark; cli?: Mark; sdk?: Mark };
  notes?: { target?: string; text: string; link?: string; linkText?: string }[];
};

const HOSTING_LABELS: Record<string, string> = {
  cloud: "Unikraft Cloud",
  byoc: "BYOC",
  "on-prem": "On-prem",
};

const INTERFACE_LABELS: Record<string, string> = {
  api: "API",
  cli: "CLI",
  sdk: "SDKs",
};

const STATUS_LABELS: Record<string, string> = {
  ga: "Generally available",
  preview: "Preview",
  "coming-soon": "Coming soon",
};

const TARGET_LABELS: Record<string, string> = {
  ...HOSTING_LABELS,
  ...INTERFACE_LABELS,
};

const isExternal = (href: string) => /^[a-z]+:/i.test(href);

const Anchor = ({ href, children }: { href: string; children: ReactNode }) =>
  isExternal(href) ? (
    <a href={href} className="underline underline-offset-2" target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link to={href} className="underline underline-offset-2">
      {children}
    </Link>
  );

const RowLabel = ({ children }: { children: ReactNode }) => (
  <span className="w-28 shrink-0 text-[11px] font-semibold uppercase leading-6 tracking-wider text-muted-foreground">
    {children}
  </span>
);

const Hint = ({ children, tone }: { children: ReactNode; tone: "amber" | "blue" }) => {
  const tones = {
    amber: "border-amber-400/60 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    blue: "border-blue-400/60 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  };
  return (
    <span className={"rounded border px-1.5 text-[10px] font-semibold uppercase tracking-wider " + tones[tone]}>
      {children}
    </span>
  );
};

const MarkChip = ({ label, mark, hint }: { label: string; mark: Mark; hint?: ReactNode }) => {
  const off = mark === false;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 text-sm " +
        (off ? "text-muted-foreground" : "text-foreground")
      }
    >
      {mark === "soon" ? (
        <ClockIcon size={16} className="text-amber-500" aria-label="Coming soon" />
      ) : off ? (
        <CircleXIcon size={16} className="text-muted-foreground/60" aria-label="Not available" />
      ) : (
        <CircleCheckIcon size={16} className="text-emerald-500" aria-label="Available" />
      )}
      <span className={off ? "line-through decoration-muted-foreground/50" : ""}>{label}</span>
      {hint}
      {mark === "differs" && <Hint tone="amber">Differs</Hint>}
    </span>
  );
};

const MarkRow = ({
  label,
  marks,
  labels,
  hints = {},
  trailing,
}: {
  label: string;
  marks: Record<string, Mark | undefined>;
  labels: Record<string, string>;
  hints?: Record<string, ReactNode>;
  trailing?: ReactNode;
}) => (
  <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
    <RowLabel>{label}</RowLabel>
    {Object.keys(labels).map((key) => (
      <MarkChip key={key} label={labels[key]} mark={marks[key] ?? true} hint={hints[key]} />
    ))}
    {trailing}
  </div>
);

/* The remark plugin in `src/remarkAvailability.ts` passes the frontmatter
   block as a JSON string, because an MDX JSX attribute cannot carry an object
   without an estree expression. A page can also place the component by hand
   with the same prop. */
export const Availability = ({ spec }: { spec: string | AvailabilitySpec }) => {
  const data: AvailabilitySpec = typeof spec === "string" ? JSON.parse(spec) : spec;
  const notes = data.notes ?? [];

  return (
    <div className="not-prose my-6 rounded-xl border border-border bg-card px-5 py-4 text-sm">
      <div className="flex flex-col gap-2">
        {data.hosting && (
          <MarkRow
            label="Available on"
            marks={data.hosting}
            labels={HOSTING_LABELS}
            hints={{
              cloud:
                data.plan === "enterprise" && data.hosting.cloud !== false ? (
                  <Hint tone="blue">Enterprise</Hint>
                ) : undefined,
            }}
            trailing={
              data.status && data.status !== "ga" ? (
                <span className="ms-auto text-xs font-medium text-amber-700 dark:text-amber-300">
                  {STATUS_LABELS[data.status]}
                </span>
              ) : undefined
            }
          />
        )}
        {data.interfaces && (
          <MarkRow label="Interfaces" marks={data.interfaces} labels={INTERFACE_LABELS} />
        )}
      </div>

      {notes.length > 0 && (
        <details className="group mt-3 border-t border-border pt-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
            <ChevronDownIcon
              size={16}
              className="text-muted-foreground transition-transform group-open:rotate-180"
            />
            {notes.length === 1 ? "1 note" : `${notes.length} notes`}
          </summary>
          <ul className="mt-2 flex flex-col gap-2 ps-6">
            {notes.map((note, i) => (
              <li key={i} className="flex flex-col gap-1 sm:flex-row sm:gap-4">
                {note.target && (
                  <span className="w-28 shrink-0 font-medium">
                    {TARGET_LABELS[note.target] ?? note.target}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {note.text}
                  {note.link && (
                    <>
                      {" "}
                      <Anchor href={note.link}>{note.linkText ?? "Learn more"}</Anchor>.
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
};
