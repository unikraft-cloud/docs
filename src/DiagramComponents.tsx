import type { CSSProperties, ReactNode } from "react";
import { Link } from "zudoku/components";

/* Anything starting with a scheme leaves the site, so it needs a plain anchor
   rather than the router's Link. */
const isExternal = (href: string) => /^[a-z]+:/i.test(href);

const Anchor = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) =>
  isExternal(href) ? (
    <a href={href} className={className} target="_blank" rel="noreferrer">
      {children}
    </a>
  ) : (
    <Link to={href} className={className}>
      {children}
    </Link>
  );

/* ------------------------------------------------------------------ */
/* Simple left-to-right flow diagram                                   */
/* ------------------------------------------------------------------ */

/* `stacked` lays the children out as bands instead of one row of boxes, for
   diagrams that need a second band under the main flow. Wrap each band in a
   `FlowRow` when you use it.

   The card is a container, and everything that turns the bands from a column
   into a row keys off its width rather than the viewport's: the prose column
   this sits in narrows when the table of contents appears and widens when the
   navigation collapses, so a viewport breakpoint would put the row layout in
   place at widths the boxes cannot fit, and they would spill past the card's
   right edge. 44rem clears the widest of these diagrams. */
export const FlowDiagram = ({
  caption,
  stacked,
  children,
}: {
  caption?: string;
  stacked?: boolean;
  children: ReactNode;
}) => (
  <div className="not-prose @container my-8 rounded-lg border border-border bg-card p-6">
    {stacked ? (
      <div className="flex flex-col gap-6">{children}</div>
    ) : (
      <div className="flex flex-col items-stretch gap-4 @min-[44rem]:flex-row @min-[44rem]:items-center">
        {children}
      </div>
    )}
    {caption && (
      <div className="mt-6 border-t border-border pt-3 text-sm text-muted-foreground">
        {caption}
      </div>
    )}
  </div>
);

export const FlowRow = ({ children }: { children: ReactNode }) => (
  <div className="flex flex-col items-stretch gap-4 @min-[44rem]:flex-row @min-[44rem]:flex-wrap @min-[44rem]:items-center">
    {children}
  </div>
);

/* `chip` renders a dashed pill under the body text, for something the box
   holds rather than something it does. `dashed` marks a box that is a copy of
   another one rather than a thing that runs on its own. */
export const FlowBox = ({
  title,
  note,
  chip,
  accent,
  dashed,
  children,
}: {
  title: string;
  note?: string;
  chip?: string;
  accent?: boolean;
  dashed?: boolean;
  children?: ReactNode;
}) => (
  <div
    className={`flex flex-1 flex-col gap-1.5 rounded-lg border p-4 ${
      dashed
        ? "border-dashed border-primary/60 bg-primary/5"
        : accent
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/40"
    }`}
  >
    <div
      className={`text-sm font-semibold ${
        accent || dashed ? "text-primary" : "text-card-foreground"
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

/* `lines` draws several parallel arrows, for a hop that spreads one stream of
   traffic over many instances. `reverse` points the arrow back the other way,
   for a diagram read from its right-hand side. */
export const FlowArrow = ({
  label,
  sublabel,
  accent,
  bidirectional,
  reverse,
  lines = 1,
}: {
  label?: string;
  sublabel?: string;
  accent?: boolean;
  bidirectional?: boolean;
  reverse?: boolean;
  lines?: number;
}) => (
  <div className="flex shrink-0 flex-col items-center gap-1 px-2 py-1 @min-[44rem]:max-w-[7rem]">
    {label && (
      <div
        className={`text-center font-mono text-xs ${
          accent ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </div>
    )}
    {/* Rotating does not change what the arrow reserves in the layout, so in
        the stacked bands the box is square: 4rem of height for what is by then
        a 4rem-tall arrow. Reserving the drawing's own height there would let
        the arrow run up over its label. */}
    <svg
      className={`h-16 w-16 rotate-90 @min-[44rem]:h-(--arrow-height) @min-[44rem]:rotate-0 ${
        accent ? "text-primary" : "text-muted-foreground"
      } ${reverse ? "-scale-x-100" : ""}`}
      viewBox={`0 0 64 ${12 * lines}`}
      style={{ "--arrow-height": `${0.75 * lines}rem` } as CSSProperties}
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: lines }, (_, i) => (
        <g key={i} transform={`translate(0 ${12 * i})`}>
          <path d="M3 6h58" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M61 6l-6-5m6 5-6 5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          {bidirectional && (
            <path d="M3 6l6-5M3 6l6 5" stroke="currentColor" strokeWidth="1.5" />
          )}
        </g>
      ))}
    </svg>
    {sublabel && (
      <div className="text-center font-mono text-xs text-muted-foreground">
        {sublabel}
      </div>
    )}
  </div>
);

/* The items of a stack or a group are the one part of a diagram that runs
   against the grain: they sit side by side while the diagram is a column, and
   turn into a column themselves once the diagram becomes a row. Three items
   stacked inside a band that is already stacked makes the narrow layout far
   taller than it needs to be. */
const STACK_ITEMS = "flex gap-2 @min-[44rem]:flex-col";

export const FlowStack = ({
  more,
  children,
}: {
  more?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-1 flex-col gap-2">
    <div className={STACK_ITEMS}>{children}</div>
    {more && (
      <div className="rounded-lg border border-dashed border-border px-4 py-2.5 text-center text-xs text-muted-foreground">
        {more}
      </div>
    )}
  </div>
);

/* An accented frame around a stack, for the cases where the platform owns the
   group of instances rather than you placing them side by side yourself. */
export const FlowGroup = ({
  title,
  titleNote,
  footnote,
  children,
}: {
  title: string;
  titleNote?: string;
  footnote?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-1 flex-col gap-2 rounded-lg border border-primary bg-primary/5 p-4">
    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
      <div className="text-sm font-semibold text-primary">{title}</div>
      {titleNote && (
        <div className="font-mono text-xs text-muted-foreground">
          {titleNote}
        </div>
      )}
    </div>
    <div className={STACK_ITEMS}>{children}</div>
    {footnote && (
      <div className="text-xs leading-snug text-muted-foreground">
        {footnote}
      </div>
    )}
  </div>
);

/* `active` marks the one item that is currently running, so a stack can show
   which instances are awake and which are parked at zero cost. `dot` adds the
   status marker in front of the label. */
export const FlowStackItem = ({
  label,
  chip,
  active,
  dot,
}: {
  label: string;
  chip?: string;
  active?: boolean;
  dot?: boolean;
}) => (
  <div
    className={`flex min-w-0 flex-1 flex-col items-start gap-1.5 rounded-lg border bg-card px-2 py-2 @min-[44rem]:flex-none @min-[44rem]:flex-row @min-[44rem]:items-center @min-[44rem]:justify-between @min-[44rem]:gap-3 @min-[44rem]:px-4 @min-[44rem]:py-2.5 ${
      active ? "border-primary/40" : "border-border"
    }`}
  >
    <div className="flex min-w-0 items-center gap-2 @min-[44rem]:min-w-min">
      {dot && (
        <span
          className={`size-2 shrink-0 rounded-full ${
            active ? "bg-primary" : "border border-border bg-muted"
          }`}
          aria-hidden="true"
        />
      )}
      <div className="break-words text-xs font-semibold text-card-foreground @min-[44rem]:text-sm">
        {label}
      </div>
    </div>
    {chip && (
      <div
        className={`max-w-full break-words rounded px-2 py-1 font-mono text-xs ${
          active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        }`}
      >
        {chip}
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Checkpoint history                                                  */
/* ------------------------------------------------------------------ */

/* A band showing an instance's checkpoints in time order, with one of them
   marked as the point a restore goes back to. */
export const CheckpointTimeline = ({
  label,
  points,
  restoreTitle,
  restoreNote,
  className,
}: {
  label?: string;
  points: { label: string; marked?: boolean }[];
  restoreTitle?: string;
  restoreNote?: string;
  className?: string;
}) => {
  const markedIndex = points.findIndex((point) => point.marked);
  return (
    <div
      className={`rounded-lg border border-border bg-muted/30 p-4 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        {label && (
          <div className="shrink-0 font-mono text-xs text-muted-foreground">
            {label}
          </div>
        )}
        {/* Below 24rem of card the label takes enough of the row that the
            point captions run into each other, so it wraps to its own line. */}
        <div className="relative flex-1 basis-full @min-[24rem]:basis-0">
          <div className="absolute inset-x-0 top-[5px] h-px bg-border" />
          <div className="relative flex justify-between">
            {points.map((point) => (
              <div
                key={point.label}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={`size-2.5 rounded-full border-2 bg-card ${
                    point.marked ? "border-primary" : "border-border"
                  }`}
                  aria-hidden="true"
                />
                <span
                  className={`font-mono text-xs ${
                    point.marked ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {point.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {restoreTitle && (
        /* A band like the ones in `FlowDiagram`, and it turns from a column
           into a row at the same width, so the arrow points at the card rather
           than away from it. The indent lines the card up under the checkpoint
           it restores, which only means anything once they sit side by side. */
        <div
          className="mt-3 flex flex-col items-stretch gap-3 @min-[44rem]:flex-row @min-[44rem]:items-center @min-[44rem]:pl-(--restore-indent)"
          style={
            {
              "--restore-indent":
                markedIndex > 0 ? `${Math.min(markedIndex * 12, 24)}%` : "0",
            } as CSSProperties
          }
        >
          <FlowArrow accent />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-primary bg-card px-4 py-2.5">
            <div className="text-sm font-semibold text-primary">
              {restoreTitle}
            </div>
            {restoreNote && (
              <div className="font-mono text-xs text-muted-foreground">
                {restoreNote}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Value cards shown at the top of each use-case page                  */
/* ------------------------------------------------------------------ */

export const ValueCards = ({ children }: { children: ReactNode }) => (
  <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-3">
    {children}
  </div>
);

/* `metric` is the one-line claim in the card's footer. */
export const ValueCard = ({
  title,
  metric,
  children,
}: {
  title: string;
  metric?: string;
  children: ReactNode;
}) => (
  <div className="flex flex-col gap-2 rounded-lg border border-border border-t-2 border-t-primary bg-card p-5">
    <div className="font-semibold text-card-foreground">{title}</div>
    <div className="text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-2 [&_a:hover]:underline [&_p]:m-0">
      {children}
    </div>
    {metric && (
      <div className="mt-auto pt-3 font-mono text-sm text-card-foreground">
        {metric}
      </div>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Under the hood: the features a use case rests on                    */
/* ------------------------------------------------------------------ */

export const FeatureTable = ({ children }: { children: ReactNode }) => (
  <div className="not-prose my-6 divide-y divide-border border-b border-border">
    {children}
  </div>
);

/* A row names one feature via `title`/`href`. When a row covers two features
   working together, pass `links` instead so each half points at its own page,
   e.g. "Stateful scale-to-zero & templates". */
export const FeatureRow = ({
  title,
  href,
  links,
  children,
}: {
  title?: string;
  href?: string;
  links?: { label: string; href: string }[];
  children: ReactNode;
}) => (
  <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-8">
    <div className="text-sm font-semibold">
      {links && links.length > 0 ? (
        links.map((link, i) => (
          <span key={link.href}>
            {i > 0 && <span className="text-primary"> & </span>}
            <Anchor
              href={link.href}
              className="text-primary underline-offset-2 hover:underline"
            >
              {link.label}
            </Anchor>
          </span>
        ))
      ) : href ? (
        <Anchor
          href={href}
          className="text-primary underline-offset-2 hover:underline"
        >
          {title}
        </Anchor>
      ) : (
        <span className="text-card-foreground">{title}</span>
      )}
    </div>
    <div className="text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline-offset-2 [&_a:hover]:underline [&_p]:m-0">
      {children}
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Closing call to action                                              */
/* ------------------------------------------------------------------ */

const SIGN_UP_HREF = "https://console.unikraft.cloud/auth/signin";

/* `guideHref` points at the guide that walks through this use case. */
export const UseCaseCta = ({
  title,
  guideHref,
  guideLabel,
  children,
}: {
  title: string;
  guideHref: string;
  guideLabel: string;
  children?: ReactNode;
}) => (
  <div className="not-prose my-8 flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex flex-col gap-1">
      <div className="font-semibold text-card-foreground">{title}</div>
      {children && (
        <div className="text-sm leading-relaxed text-muted-foreground [&_a]:text-primary [&_p]:m-0">
          {children}
        </div>
      )}
    </div>
    <div className="flex shrink-0 flex-wrap items-center gap-3">
      <Anchor
        href={SIGN_UP_HREF}
        className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted"
      >
        Sign up
      </Anchor>
      <Anchor
        href={guideHref}
        className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90"
      >
        {guideLabel} &rarr;
      </Anchor>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Use-case overview page                                              */
/* ------------------------------------------------------------------ */

export const UseCaseGroup = ({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) => (
  <section className="not-prose my-7">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      {note && <span className="text-sm text-muted-foreground">{note}</span>}
    </div>
    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
  </section>
);

/* `tags` are the platform features the use case leans on, each linking to the
   page that documents it.

   The title link stretches a pseudo-element over the whole card, so clicking
   anywhere on the box opens the use case. The tags are positioned, which lifts
   them above that overlay and keeps them clickable in their own right. */
export const UseCaseCard = ({
  title,
  href,
  tags,
  children,
}: {
  title: string;
  href: string;
  tags?: { label: string; href: string }[];
  children: ReactNode;
}) => (
  <div className="relative flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50">
    <h3 className="m-0 text-base font-semibold">
      <Anchor
        href={href}
        className="text-card-foreground underline-offset-2 before:absolute before:inset-0 before:content-[''] hover:text-primary"
      >
        {title}
      </Anchor>
    </h3>
    <div className="text-sm leading-relaxed text-muted-foreground [&_p]:m-0">
      {children}
    </div>
    {tags && tags.length > 0 && (
      <div className="relative mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 font-mono text-xs">
        <span className="text-muted-foreground">Uses:</span>
        {tags.map((tag, i) => (
          <span
            key={`${tag.href}-${tag.label}`}
            className="flex items-center gap-2"
          >
            {i > 0 && <span className="text-muted-foreground">&middot;</span>}
            <Anchor
              href={tag.href}
              className="text-primary underline-offset-2 hover:underline"
            >
              {tag.label}
            </Anchor>
          </span>
        ))}
      </div>
    )}
  </div>
);
