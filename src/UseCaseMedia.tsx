import { useEffect, useRef, useState } from "react";

/**
 * Use-case demo media, presented the way the landing site presents it.
 *
 * Nothing is copied into this repo: recordings, videos, caption data and the
 * player itself all come from the landing site, which is their single source of
 * truth and ships in the same image as these docs.
 *
 * Presentation is deliberately the upstream player's own: its stock stylesheet
 * and built-in `asciinema` theme. The landing's `unikraft` palette, frame and
 * caption styling live in its CSS bundle rather than at a URL, so sharing them
 * means publishing them first; that is a later step, not a prerequisite. Until
 * then the frame and caption pill below are plain utility classes.
 *
 * Because the two are served together, every path below is same-origin by
 * construction rather than by coincidence, so none of this needs a CORS grant:
 * not the caption <track>, not the recording fetch()es. The exception is a
 * docs-only build (`pnpm dev`, or this repo's standalone preview), which
 * serves nothing outside /docs, so the media 404s there. That preview could
 * never show the recordings anyway, since its Caddyfile has no /asciinema.
 */

/* Root-relative, and deliberately not prefixed with the docs basePath: these
   paths are the landing site's, served from the domain root, while this app
   lives under /docs on the same origin. Vite rewrites imported assets but
   leaves literal URLs alone, so they resolve as written: in production, in a
   www PR preview, and in the on-prem image, with no hostname to keep current. */
const PLAYER_JS = "/asciinema/asciinema-player.min.js";
const PLAYER_CSS = "/asciinema/asciinema-player.css";

type Cue = { at: number; text: string; duration?: number };

/* ------------------------------------------------------------------ */
/* Video                                                               */
/* ------------------------------------------------------------------ */

/* `src` and `captions` are bare filenames from the landing site's /videos,
   e.g. "openclaw.webm" and "openclaw.vtt".

   Captions ride as a native WebVTT track rather than an overlay, so the
   browser renders them and readers can switch them off. Deliberately no
   `crossOrigin`: it would make the video request itself a CORS request, so
   without a grant the video would fail to load outright rather than simply
   dropping its captions. */
export const UseCaseVideo = ({
  src,
  captions,
  poster,
}: {
  src: string;
  captions?: string;
  poster?: string;
}) => (
  <video
    className="my-8 block w-full rounded-lg border border-border bg-black"
    src={`/videos/${src}`}
    poster={poster ? `/videos/${poster}` : undefined}
    controls
    loop
    muted
    playsInline
    preload="metadata"
  >
    {captions && (
      <track
        kind="captions"
        srcLang="en"
        label="English"
        src={`/videos/${captions}`}
        default
      />
    )}
  </video>
);

/* ------------------------------------------------------------------ */
/* Terminal recording                                                  */
/* ------------------------------------------------------------------ */

type PlayerHandle = {
  dispose?: () => void;
  getCurrentTime?: () => number | Promise<number>;
};

type AsciinemaGlobal = {
  create: (
    src: string,
    el: HTMLElement,
    opts: Record<string, unknown>,
  ) => PlayerHandle;
};

const stylesheet = (href: string) => {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
};

/* One shared load per page: several recordings on one route should not each
   append the script. Classic scripts and stylesheets are not CORS-governed, so
   these load from any origin, unlike the fetch()es below. */
let playerLoad: Promise<void> | null = null;

const loadPlayer = () => {
  if (typeof window === "undefined") return Promise.resolve();
  if ((window as unknown as { AsciinemaPlayer?: unknown }).AsciinemaPlayer) {
    return Promise.resolve();
  }
  playerLoad ??= new Promise<void>((resolve, reject) => {
    stylesheet(PLAYER_CSS);
    const script = document.createElement("script");
    script.src = PLAYER_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`could not load ${PLAYER_JS}`));
    document.head.appendChild(script);
  });
  return playerLoad;
};

/* The landing's rule (AsciinemaPlayerReact `pickActiveCaption`): the active
   cue is the latest one whose `at <= t`; `duration` ends it early, otherwise
   it holds until the next cue starts. */
const cueAt = (cues: Cue[], t: number) => {
  let active: Cue | undefined;
  for (const c of cues) {
    if (c.at <= t) active = c;
    else break;
  }
  if (active?.duration !== undefined && t > active.at + active.duration) {
    return undefined;
  }
  return active;
};

/* `src` and `captions` are bare filenames from the landing site's /asciinema,
   e.g. "databases.cast" and "databases.captions.json". `startAt` skips a
   preamble; pass the value the landing uses so both show the same thing.

   Sizing needs no work here: `fit: "width"` plus the player's own
   ResizeObserver keeps the terminal inside its container as the page reflows.
   The stock `asciinema` theme is a fixed dark terminal, so it reads the same
   in either docs theme. */
export const UseCaseCast = ({
  src,
  captions,
  startAt,
}: {
  src: string;
  captions?: string;
  startAt?: number | string;
}) => {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<PlayerHandle | null>(null);
  const [cues, setCues] = useState<Cue[]>([]);
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (!captions) return;
    let cancelled = false;
    fetch(`/asciinema/${captions}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Cue[]) => {
        if (!cancelled && Array.isArray(data)) {
          setCues([...data].sort((a, b) => a.at - b.at));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [captions]);

  useEffect(() => {
    let disposed = false;
    let frame = 0;

    loadPlayer()
      .then(() => {
        if (disposed || !hostRef.current) return;
        const { AsciinemaPlayer } = window as unknown as {
          AsciinemaPlayer: AsciinemaGlobal;
        };

        playerRef.current = AsciinemaPlayer.create(
          `/asciinema/${src}`,
          hostRef.current,
          {
            theme: "asciinema",
            fit: "width",
            preload: true,
            controls: true,
            loop: true,
            autoPlay: false,
            ...(startAt !== undefined ? { startAt } : {}),
          },
        );

        /* The player exposes no timeupdate event, so the caption overlay polls
           it, the same approach the landing takes. */
        const tick = async () => {
          const player = playerRef.current;
          if (player?.getCurrentTime) {
            try {
              const t = await player.getCurrentTime();
              if (typeof t === "number" && !Number.isNaN(t)) setTime(t);
            } catch {
              /* not ready yet; the next frame picks it up */
            }
          }
          if (!disposed) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      })
      .catch((e) => console.error(e));

    return () => {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      try {
        playerRef.current?.dispose?.();
      } catch {
        /* already torn down */
      }
      playerRef.current = null;
      if (hostRef.current) hostRef.current.innerHTML = "";
    };
  }, [src, startAt]);

  const text = cues.length > 0 ? (cueAt(cues, time)?.text ?? "") : "";

  return (
    <div className="not-prose my-8 overflow-hidden rounded-lg border border-border">
      <div className="relative">
        <div ref={hostRef} />
        {cues.length > 0 && (
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-x-0 bottom-12 z-10 flex justify-center px-4"
          >
            <span
              className={`max-w-[92%] rounded-md bg-primary/85 px-2.5 py-1.5 text-center font-mono text-xs leading-relaxed text-white transition-opacity duration-200 ${
                text ? "opacity-100" : "opacity-0"
              }`}
            >
              {text}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
