import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  Archive,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Check,
  ChevronDown,
  Download,
  FileText,
  Image as ImageIcon,
  Lock,
  Menu,
  Music2,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Table2,
  Trash2,
  UploadCloud,
  X,
  type LucideIcon,
} from "lucide-react";
import { SplineStage } from "@/components/landing/spline-stage";
import "@/components/landing/landing.css";

type Theme = "light" | "dark";

const CHAPTERS: Array<{
  id: string;
  label: string;
  theme: Theme;
}> = [
  { id: "opening", label: "Opening", theme: "light" },
  { id: "trap", label: "The trap", theme: "light" },
  { id: "shift", label: "The shift", theme: "dark" },
  { id: "formats", label: "Formats", theme: "dark" },
  { id: "privacy", label: "Privacy", theme: "light" },
  { id: "start", label: "Start", theme: "dark" },
];

const NAV_LINKS: Array<{ label: string; chapter: number }> = [
  { label: "Story", chapter: 0 },
  { label: "Formats", chapter: 3 },
  { label: "Privacy", chapter: 4 },
];

const HASH_TO_CHAPTER: Record<string, number> = {
  "#opening": 0,
  "#story": 0,
  "#trap": 1,
  "#shift": 2,
  "#formats": 3,
  "#privacy": 4,
  "#start": 5,
  "#begin": 5,
};

const FORMAT_GROUPS = [
  {
    label: "Documents",
    formats: ["PDF", "DOCX", "DOC", "TXT", "HTML"],
  },
  {
    label: "Images",
    formats: ["JPG", "PNG", "WEBP", "AVIF", "GIF", "SVG"],
  },
  {
    label: "Media",
    formats: ["MP3", "WAV", "M4A", "MP4", "MOV", "WEBM"],
  },
  {
    label: "Data",
    formats: ["CSV", "XLSX", "JSON", "YAML", "XML"],
  },
];

const STEPS: Array<{ icon: LucideIcon; title: string; note: string }> = [
  { icon: UploadCloud, title: "Drop", note: "up to 10 files" },
  { icon: SlidersHorizontal, title: "Choose", note: "one or many outputs" },
  { icon: Download, title: "Download", note: "individually or as a zip" },
];

const LIFECYCLE: Array<{
  icon: LucideIcon;
  title: string;
  note: string;
}> = [
  { icon: UploadCloud, title: "Upload", note: "Private session" },
  { icon: RefreshCw, title: "Convert", note: "Only your file" },
  { icon: Download, title: "Download", note: "Yours to keep" },
  { icon: Trash2, title: "Erase", note: "Within 2 hours" },
];

const FORMAT_MARQUEE = [
  "PDF",
  "DOCX",
  "TXT",
  "HTML",
  "JPG",
  "PNG",
  "WEBP",
  "AVIF",
  "SVG",
  "MP3",
  "WAV",
  "M4A",
  "MP4",
  "WEBM",
  "CSV",
  "XLSX",
  "JSON",
  "YAML",
  "TOML",
  "XML",
  "ZIP",
  "TAR",
];

function usePanelMotion(progress: MotionValue<number>, index: number) {
  const center = (index + 0.5) / CHAPTERS.length;
  const first = index === 0;
  const last = index === CHAPTERS.length - 1;
  const inStart = first ? -0.2 : center - 0.055;
  const inEnd = first ? 0 : center - 0.025;
  const outStart = last ? 1.2 : center + 0.025;
  const outEnd = last ? 1.4 : center + 0.055;

  const opacity = useTransform(
    progress,
    [inStart, inEnd, outStart, outEnd],
    [first ? 1 : 0, 1, 1, last ? 1 : 0],
  );
  const y = useTransform(
    progress,
    [inStart, inEnd, outStart, outEnd],
    [first ? 0 : 26, 0, 0, last ? 0 : -22],
  );

  return { opacity, y };
}

type ChapterPanelProps = {
  index: number;
  progress: MotionValue<number>;
  active: boolean;
  theme: Theme;
  label: string;
  className?: string;
  children: React.ReactNode;
};

function ChapterPanel({
  index,
  progress,
  active,
  theme,
  label,
  className,
  children,
}: ChapterPanelProps) {
  const { opacity, y } = usePanelMotion(progress, index);
  const inertProps = !active
    ? ({ inert: "" } as unknown as { inert?: string })
    : {};

  return (
    <motion.section
      id={CHAPTERS[index].id}
      className={`story-panel is-${theme}${className ? ` ${className}` : ""}${
        active ? " is-active" : ""
      }`}
      aria-label={label}
      aria-hidden={!active}
      {...inertProps}
      style={{
        opacity,
        y,
        pointerEvents: active ? "auto" : "none",
      }}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  const journeyRef = useRef<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [headerTheme, setHeaderTheme] = useState<Theme>("light");
  const [scrolled, setScrolled] = useState(false);
  const reduceMotion = Boolean(useReducedMotion());

  const { scrollYProgress } = useScroll({
    target: journeyRef,
    offset: ["start start", "end end"],
  });

  const progressScale = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    mass: 0.3,
  });

  const backgroundColor = useTransform(
    scrollYProgress,
    [0, 0.3, 0.36, 0.64, 0.69, 0.8, 0.86, 1],
    [
      "#f4faf9",
      "#f4faf9",
      "#052a31",
      "#052a31",
      "#eef8f4",
      "#eef8f4",
      "#031a20",
      "#031a20",
    ],
  );

  const orbitOpacity = useTransform(
    scrollYProgress,
    [0.29, 0.36, 0.46, 0.58, 0.66, 0.71],
    [0, 0.8, 1, 1, 0.45, 0],
  );

  const shieldOpacity = useTransform(
    scrollYProgress,
    [0.68, 0.72, 0.78, 0.82],
    [0, 1, 1, 0],
  );

  const scrollToChapter = (
    index: number,
    behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth",
  ) => {
    const journey = journeyRef.current;
    if (!journey) return;
    const range = Math.max(0, journey.offsetHeight - window.innerHeight);
    const progressTarget =
      index === 0 ? 0 : Math.min(1, (index + 0.5) / CHAPTERS.length);
    const top = journey.offsetTop + range * progressTarget;
    window.scrollTo({ top, behavior });
    setMobileOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    setMobileOpen(false);
  };

  const syncChapterState = (value: number) => {
    const nextActive = Math.min(
      CHAPTERS.length - 1,
      Math.max(0, Math.floor(value * CHAPTERS.length)),
    );
    const nextTheme: Theme =
      (value > 0.33 && value < 0.665) || value > 0.845 ? "dark" : "light";

    setActiveChapter((current) =>
      current === nextActive ? current : nextActive,
    );
    setHeaderTheme((current) =>
      current === nextTheme ? current : nextTheme,
    );
  };

  useMotionValueEvent(scrollYProgress, "change", syncChapterState);

  useEffect(() => {
    syncChapterState(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollYProgress]);

  useEffect(() => {
    document.title = "ConvertHub — Every file has another life";
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 980) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    const index = HASH_TO_CHAPTER[hash];
    if (index === undefined) return;
    const timeout = window.setTimeout(() => {
      scrollToChapter(index, "auto");
    }, 260);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="story-root" id="top">
      <a className="story-skip" href="#story-footer">
        Skip the story
      </a>

      <motion.div
        className="story-progress-bar"
        style={{ scaleX: progressScale }}
      />

      <header
        className={`story-header${scrolled ? " is-scrolled" : ""}${
          headerTheme === "dark" ? " is-dark" : ""
        }${mobileOpen ? " is-menu-open" : ""}`}
      >
        <div className="story-header-inner">
          <a
            className="story-logo"
            href="#top"
            onClick={(event) => {
              event.preventDefault();
              scrollToTop();
            }}
            aria-label="ConvertHub, back to the beginning"
          >
            <span className="story-logo-mark">
              <ArrowLeftRight size={17} strokeWidth={2.3} />
            </span>
            <span>
              Convert<em>Hub</em>
            </span>
          </a>

          <nav className="story-nav" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                className="story-nav-link"
                onClick={() => scrollToChapter(link.chapter)}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="story-header-actions">
            <Link
              href="/convert"
              className="story-btn story-btn-primary story-btn-sm"
            >
              Open the converter
              <ArrowRight size={15} />
            </Link>
            <button
              className="story-mobile-toggle"
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </header>

      {mobileOpen ? (
        <div className="story-mobile-menu" role="dialog" aria-modal="true">
          <nav aria-label="Mobile navigation">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollToChapter(link.chapter)}
              >
                {link.label}
                <ArrowRight size={18} />
              </button>
            ))}
          </nav>
          <div className="story-mobile-menu-foot">
            <p>40+ formats. 10 files at once. No account.</p>
            <Link
              href="/convert"
              className="story-btn story-btn-yellow"
              onClick={() => setMobileOpen(false)}
            >
              Start converting
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : null}

      <main>
        <section
          ref={journeyRef}
          id="story"
          className={`story-journey is-${headerTheme}`}
          aria-label="The ConvertHub story"
        >
          <div className={`story-pin is-${headerTheme}`}>
            <motion.div
              className="story-bg"
              style={{ backgroundColor }}
              aria-hidden="true"
            />
            <div className="story-glow story-glow-a" aria-hidden="true" />
            <div className="story-glow story-glow-b" aria-hidden="true" />
            <div className="story-glow story-glow-c" aria-hidden="true" />
            <div className="story-grid" aria-hidden="true" />

            <motion.div
              className="story-orbits"
              style={{ opacity: orbitOpacity }}
              aria-hidden="true"
            >
              <span className="story-orbit story-orbit-a" />
              <span className="story-orbit story-orbit-b" />
              <span className="story-orbit story-orbit-c" />
            </motion.div>

            <motion.div
              className="story-shield"
              style={{ opacity: shieldOpacity }}
              aria-hidden="true"
            >
              <span />
              <span />
            </motion.div>

            <SplineStage
              progress={scrollYProgress}
              reducedMotion={reduceMotion}
            />

            <ChapterPanel
              index={0}
              progress={scrollYProgress}
              active={activeChapter === 0}
              theme="light"
              label="Opening: Every file has another life"
              className="story-panel-hero"
            >
              <div className="story-panel-inner">
                <div className="story-eyebrow">
                  <span className="story-dot" />
                  01 · A calmer way to change formats
                  <span className="story-rule" />
                </div>

                <h1 className="story-h1">
                  <span>Every file</span>
                  <span>has another</span>
                  <span>
                    <em>life.</em>
                  </span>
                </h1>

                <p className="story-lede">
                  ConvertHub turns documents, images, media and data into the
                  format the moment needs —{" "}
                  <strong>quickly, quietly, and without an account.</strong>
                </p>

                <div className="story-actions">
                  <Link
                    href="/convert"
                    className="story-btn story-btn-primary"
                  >
                    Start converting
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    className="story-btn story-btn-outline"
                    onClick={() => scrollToChapter(1)}
                  >
                    Read the story
                    <ChevronDown size={16} />
                  </button>
                </div>

                <div className="story-meta">
                  <span>
                    <Check size={12} strokeWidth={2.5} />
                    40+ formats
                  </span>
                  <span>
                    <Check size={12} strokeWidth={2.5} />
                    10 files at once
                  </span>
                  <span>
                    <Check size={12} strokeWidth={2.5} />
                    No sign-up
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="story-scroll-cue"
                onClick={() => scrollToChapter(1)}
                aria-label="Scroll to the next chapter"
              >
                <span className="story-cue-line">
                  <i />
                </span>
                Scroll to begin
              </button>

              <div className="story-hero-chips" aria-hidden="true">
                <div className="story-chip chip-a">
                  <span className="story-chip-icon is-blue">
                    <ImageIcon size={13} />
                  </span>
                  <span className="story-chip-copy">
                    <strong>campaign.jpg</strong>
                    <small>Image · 2.4 MB</small>
                  </span>
                  <b>WEBP</b>
                </div>

                <div className="story-chip chip-b">
                  <span className="story-chip-icon is-teal">
                    <FileText size={13} />
                  </span>
                  <span className="story-chip-copy">
                    <strong>report.docx</strong>
                    <small>Document · 1.8 MB</small>
                  </span>
                  <b>PDF</b>
                </div>

                <div className="story-chip chip-c">
                  <span className="story-chip-icon is-orange">
                    <Music2 size={13} />
                  </span>
                  <span className="story-chip-copy">
                    <strong>field-notes.wav</strong>
                    <small>Audio · 12.3 MB</small>
                  </span>
                  <b>MP3</b>
                </div>

                <div className="story-chip chip-d">
                  <span className="story-chip-icon is-yellow">
                    <Table2 size={13} />
                  </span>
                  <span className="story-chip-copy">
                    <strong>stock-list.csv</strong>
                    <small>Data · 84 KB</small>
                  </span>
                  <b>JSON</b>
                </div>
              </div>
            </ChapterPanel>

            <ChapterPanel
              index={1}
              progress={scrollYProgress}
              active={activeChapter === 1}
              theme="light"
              label="The format trap"
            >
              <div className="story-panel-inner">
                <div className="story-eyebrow">
                  <span className="story-rule" />
                  02 · The format trap
                </div>

                <h2 className="story-h2">
                  The right file.
                  <br />
                  <em>The wrong language.</em>
                </h2>

                <p className="story-lede">
                  You did the work. The photograph is sharp, the report is
                  finished, the recording is clear. Then one extension gets in
                  the way.
                </p>

                <div className="story-mismatch-grid">
                  <div className="story-mismatch">
                    <span className="story-mismatch-icon is-blue">
                      <ImageIcon size={14} />
                    </span>
                    <span className="story-mismatch-copy">
                      <strong>launch-photo.jpg</strong>
                      <span>Image · 2.4 MB</span>
                    </span>
                    <span className="story-mismatch-need">needs .webp</span>
                  </div>

                  <div className="story-mismatch">
                    <span className="story-mismatch-icon is-teal">
                      <FileText size={14} />
                    </span>
                    <span className="story-mismatch-copy">
                      <strong>q3-report.docx</strong>
                      <span>Document · 1.8 MB</span>
                    </span>
                    <span className="story-mismatch-need">needs .pdf</span>
                  </div>

                  <div className="story-mismatch">
                    <span className="story-mismatch-icon is-orange">
                      <Music2 size={14} />
                    </span>
                    <span className="story-mismatch-copy">
                      <strong>field-notes.wav</strong>
                      <span>Audio · 12.3 MB</span>
                    </span>
                    <span className="story-mismatch-need">needs .mp3</span>
                  </div>

                  <div className="story-mismatch">
                    <span className="story-mismatch-icon is-yellow">
                      <Table2 size={14} />
                    </span>
                    <span className="story-mismatch-copy">
                      <strong>stock-list.xlsx</strong>
                      <span>Sheet · 96 KB</span>
                    </span>
                    <span className="story-mismatch-need">needs .csv</span>
                  </div>
                </div>

                <div className="story-callout">
                  <Lock size={13} />
                  Same content. Wrong container.
                </div>
              </div>
            </ChapterPanel>

            <ChapterPanel
              index={2}
              progress={scrollYProgress}
              active={activeChapter === 2}
              theme="dark"
              label="The shift: one drop, every direction"
            >
              <div className="story-panel-inner">
                <div className="story-eyebrow">
                  <span className="story-dot" />
                  03 · The shift
                  <span className="story-rule" />
                </div>

                <h2 className="story-h2">
                  One drop.
                  <br />
                  <em>Every direction.</em>
                </h2>

                <p className="story-lede">
                  A single upload is all the context it needs. ConvertHub reads
                  the file, changes the container, and leaves the content
                  intact.
                </p>

                <div className="story-steps">
                  {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <div className="story-step" key={step.title}>
                        <span className="story-step-top">
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <Icon size={15} />
                        </span>
                        <strong>{step.title}</strong>
                        <small>{step.note}</small>
                      </div>
                    );
                  })}
                </div>

                <div className="story-engine-row">
                  <span>Under the hood</span>
                  <code>Sharp</code>
                  <code>FFmpeg</code>
                  <code>LibreOffice</code>
                  <code>Pandoc</code>
                </div>
              </div>
            </ChapterPanel>

            <ChapterPanel
              index={3}
              progress={scrollYProgress}
              active={activeChapter === 3}
              theme="dark"
              label="The passport: any format"
            >
              <div className="story-panel-inner">
                <div className="story-eyebrow">
                  <span className="story-rule" />
                  04 · The passport
                </div>

                <h2 className="story-h2">
                  One file.
                  <br />
                  <em>Any format.</em>
                </h2>

                <p className="story-lede">
                  Documents, images, audio, video, spreadsheets and structured
                  data — over 40 formats, one quiet hand-off.
                </p>

                <div className="story-format-groups">
                  {FORMAT_GROUPS.map((group) => (
                    <div className="story-format-group" key={group.label}>
                      <span className="story-format-label">{group.label}</span>
                      <div className="story-pills">
                        {group.formats.map((format) => (
                          <span
                            className="story-pill"
                            key={`${group.label}-${format}`}
                          >
                            {format}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="story-format-note">
                  <Archive size={13} />
                  Archives too — ZIP, TAR, TAR.GZ
                </div>
              </div>
            </ChapterPanel>

            <ChapterPanel
              index={4}
              progress={scrollYProgress}
              active={activeChapter === 4}
              theme="light"
              label="The promise: your files are guests"
            >
              <div className="story-panel-inner">
                <div className="story-eyebrow">
                  <span className="story-dot" />
                  05 · The promise
                  <span className="story-rule" />
                </div>

                <h2 className="story-h2">
                  Your files are guests.
                  <br />
                  <em>Not residents.</em>
                </h2>

                <p className="story-lede">
                  Every upload gets its own private session. Files are held only
                  long enough to finish the job, then cleaned up automatically —
                  no profile, no permanent library, nothing to remember you by.
                </p>

                <div className="story-lifecycle">
                  {LIFECYCLE.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div className="story-life" key={item.title}>
                        <span className="story-life-icon">
                          <Icon size={15} />
                        </span>
                        <span className="story-life-index">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <strong>{item.title}</strong>
                        <small>{item.note}</small>
                      </div>
                    );
                  })}
                </div>

                <div className="story-safe-note">
                  <ShieldCheck size={14} />
                  No account. No install. Nothing kept after cleanup.
                </div>
              </div>

              <div className="story-timer" aria-hidden="true">
                <span className="story-timer-icon">
                  <Trash2 size={15} />
                </span>
                <span className="story-timer-copy">
                  <strong>Auto-cleanup</strong>
                  <small>within 2 hours</small>
                </span>
              </div>
            </ChapterPanel>

            <ChapterPanel
              index={5}
              progress={scrollYProgress}
              active={activeChapter === 5}
              theme="dark"
              label="The next chapter: give every file another life"
              className="story-panel-final"
            >
              <div className="story-panel-inner">
                <div className="story-eyebrow">
                  <span className="story-dot" />
                  06 · The next chapter
                  <span className="story-rule" />
                </div>

                <h2 className="story-h2">
                  Give every file
                  <br />
                  <em>another life.</em>
                </h2>

                <p className="story-lede">
                  Bring the file you have. Leave with the one you need.
                  ConvertHub handles the hand-off, so you can get back to the
                  work.
                </p>

                <div className="story-actions">
                  <Link
                    href="/convert"
                    className="story-btn story-btn-yellow"
                  >
                    Open the converter
                    <ArrowRight size={16} />
                  </Link>
                  <button
                    type="button"
                    className="story-btn story-btn-ghost-light"
                    onClick={scrollToTop}
                  >
                    Back to the beginning
                    <ArrowUp size={15} />
                  </button>
                </div>

                <div className="story-meta">
                  <span>
                    <Check size={12} strokeWidth={2.5} />
                    No account
                  </span>
                  <span>
                    <Check size={12} strokeWidth={2.5} />
                    No install
                  </span>
                  <span>
                    <Check size={12} strokeWidth={2.5} />
                    No format left behind
                  </span>
                </div>

                <div className="story-final-facts">
                  <div>
                    <strong>40+</strong>
                    <span>formats</span>
                  </div>
                  <div>
                    <strong>10</strong>
                    <span>files per batch</span>
                  </div>
                  <div>
                    <strong>2 hrs</strong>
                    <span>auto-cleanup</span>
                  </div>
                </div>
              </div>
            </ChapterPanel>

            <nav
              className={`story-rail is-${headerTheme}`}
              aria-label="Story chapters"
            >
              {CHAPTERS.map((chapter, index) => (
                <button
                  key={chapter.id}
                  type="button"
                  className={`story-rail-item${
                    activeChapter === index ? " is-active" : ""
                  }`}
                  onClick={() => scrollToChapter(index)}
                  aria-label={`Go to chapter ${index + 1}: ${chapter.label}`}
                  aria-current={activeChapter === index ? "step" : undefined}
                >
                  <span className="story-rail-label">{chapter.label}</span>
                  <span className="story-rail-num">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="story-rail-tick" />
                </button>
              ))}
            </nav>

            <div className="story-mobile-progress">
              <span className="story-mobile-progress-label">
                {String(activeChapter + 1).padStart(2, "0")} /{" "}
                {String(CHAPTERS.length).padStart(2, "0")}
              </span>
              <div className="story-mobile-dots">
                {CHAPTERS.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    type="button"
                    className={activeChapter === index ? "is-active" : ""}
                    aria-label={`Go to chapter ${index + 1}: ${chapter.label}`}
                    onClick={() => scrollToChapter(index)}
                  />
                ))}
              </div>
            </div>

            <span className={`story-credit is-${headerTheme}`}>
              Interactive 3D ·{" "}
              <a
                href="https://spline.design"
                target="_blank"
                rel="noopener noreferrer"
              >
                Spline
              </a>
            </span>
          </div>
        </section>
      </main>

      <footer className="story-footer" id="story-footer">
        <div className="story-footer-glow" aria-hidden="true" />
        <div className="story-container">
          <div className="story-footer-grid">
            <div className="story-footer-brand">
              <a
                className="story-footer-logo"
                href="#top"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToTop();
                }}
              >
                <span className="story-logo-mark">
                  <ArrowLeftRight size={17} strokeWidth={2.3} />
                </span>
                <span>
                  Convert<em>Hub</em>
                </span>
              </a>
              <p>
                A quieter way to change formats. Built for the files that need
                to keep moving.
              </p>
              <a
                className="story-footer-spline"
                href="https://spline.design"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Sparkles size={13} />
                Interactive 3D by Spline
              </a>
            </div>

            <div className="story-footer-col">
              <h4>Product</h4>
              <ul>
                <li>
                  <Link href="/convert">Converter</Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={() => scrollToChapter(2)}
                  >
                    How it works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={() => scrollToChapter(3)}
                  >
                    Formats
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={() => scrollToChapter(4)}
                  >
                    Privacy
                  </button>
                </li>
              </ul>
            </div>

            <div className="story-footer-col">
              <h4>Story</h4>
              <ul>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={() => scrollToChapter(1)}
                  >
                    The format trap
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={() => scrollToChapter(2)}
                  >
                    The shift
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={() => scrollToChapter(4)}
                  >
                    The promise
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={() => scrollToChapter(5)}
                  >
                    The next chapter
                  </button>
                </li>
              </ul>
            </div>

            <div className="story-footer-col">
              <h4>Elsewhere</h4>
              <ul>
                <li>
                  <a
                    href="https://portfolio-two-tau-92.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Built by Koneru Shritej
                  </a>
                </li>
                <li>
                  <a
                    href="https://spline.design"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Spline 3D
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    className="story-footer-link"
                    onClick={scrollToTop}
                  >
                    Back to top
                    <ArrowUp size={12} />
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="story-footer-marquee" aria-hidden="true">
            <div className="story-footer-marquee-track">
              {[0, 1].map((copy) => (
                <div
                  className="story-footer-marquee-copy"
                  key={`marquee-${copy}`}
                >
                  {FORMAT_MARQUEE.map((format) => (
                    <span key={`${copy}-${format}`}>
                      {format}
                      <i />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="story-footer-bottom">
            <span>
              © {new Date().getFullYear()} ConvertHub. All rights reserved.
            </span>
            <span>
              Made with care by{" "}
              <a
                href="https://portfolio-two-tau-92.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Koneru Shritej
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
