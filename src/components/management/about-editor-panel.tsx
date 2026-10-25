"use client";

import SiriOrb from "@/components/ai/SiriOrb";
import { FloatingButtonGroup } from "@/components/arc/floating-button-group/floating-button-group";
import {
  languageCodes,
  languageLabels,
  languages,
  type Locale,
} from "@/i18n/settings";
import {
  DEFAULT_TRANSLATE_MODEL,
  TRANSLATE_MODELS,
} from "@/lib/llm-models";
import { cn } from "cn";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

export type AboutTranslateOptions = {
  model: string;
  mode: "all" | "selective";
  fields: Set<string>;
  target: Locale;
};

type ActivePanel = "lang" | "ai" | null;

const MODELS = TRANSLATE_MODELS;

/**
 * Right-side float control — language + AI translate for About CMS tabs.
 * Same chrome as ProjectEditorPanel (without publish).
 */
export function AboutEditorPanel({
  currentLang,
  onLangChange,
  onTranslate,
  translating,
  fields,
  showAi = true,
}: {
  currentLang: Locale;
  onLangChange: (lang: Locale) => void;
  onTranslate?: (opts: AboutTranslateOptions) => Promise<void>;
  translating?: boolean;
  fields: { id: string; name: string }[];
  showAi?: boolean;
}) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [renderedPanel, setRenderedPanel] = useState<ActivePanel>(null);
  const [phase, setPhase] = useState<"idle" | "exit" | "enter">("idle");
  const pillRef = useRef<HTMLDivElement>(null);

  const [model, setModel] = useState(DEFAULT_TRANSLATE_MODEL);
  const [mode, setMode] = useState<"all" | "selective">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [target, setTarget] = useState<Locale>(
    () => languages.find((l) => l !== currentLang) ?? "th"
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (target === currentLang) {
      setTarget(languages.find((l) => l !== currentLang) ?? "en");
    }
  }, [currentLang, target]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (pillRef.current && !pillRef.current.contains(e.target as Node)) {
        if (activePanel !== null) transition(null);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [activePanel]);

  function transition(next: ActivePanel) {
    setPhase("exit");
    window.setTimeout(() => {
      setActivePanel(next);
      setRenderedPanel(next);
      setPhase("enter");
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setPhase("idle"))
      );
    }, 160);
  }

  function toggleField(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function runTranslate() {
    if (!onTranslate || busy || translating) return;
    setBusy(true);
    try {
      await onTranslate({ model, mode, fields: selected, target });
      transition(null);
    } finally {
      setBusy(false);
    }
  }

  const viewStyle: CSSProperties = {
    opacity: phase === "idle" ? 1 : 0,
    transform:
      phase === "exit"
        ? "translateX(6px) scale(0.98)"
        : phase === "enter"
          ? "translateX(-6px) scale(0.98)"
          : "translateX(0) scale(1)",
    transition: "opacity 0.16s ease, transform 0.16s ease",
  };

  const isTranslating = busy || Boolean(translating);

  return (
    <div
      ref={pillRef}
      className="cms-float-panel"
      data-open={renderedPanel ? "1" : "0"}
    >
      <div style={viewStyle}>
        {renderedPanel === null ? (
          <div className="cms-float-panel__rail cms-float-panel__rail--fbg">
            <FloatingButtonGroup
              className="cms-float-panel__fbg"
              label="About controls"
              variant="floating"
              size="md"
              orientation="vertical"
              iconOnly
              tooltipSide="left"
              items={[
                {
                  id: "lang",
                  label: `Language · ${languageCodes[currentLang]}`,
                  icon: (
                    <span className="cms-float-panel__lang">
                      {languageCodes[currentLang]}
                    </span>
                  ),
                  onSelect: () => transition("lang"),
                },
                ...(showAi && onTranslate
                  ? ([
                      { type: "separator" as const },
                      {
                        id: "ai",
                        label: "AI translate",
                        icon: (
                          <span
                            className={cn(
                              "cms-float-panel__orb-wrap",
                              isTranslating && "is-busy"
                            )}
                          >
                            <SiriOrb
                              size={22}
                              variant={
                                MODELS.find((m) => m.id === model)?.variant ??
                                "ocean"
                              }
                              isTalking={isTranslating}
                            />
                          </span>
                        ),
                        onSelect: () => transition("ai"),
                      },
                    ] as const)
                  : []),
              ]}
            />
          </div>
        ) : null}

        {renderedPanel === "lang" ? (
          <div className="cms-float-panel__sheet">
            <header className="cms-float-panel__head">
              <span>Language</span>
              <button
                type="button"
                className="cms-float-panel__btn cms-float-panel__btn--sm"
                onClick={() => transition(null)}
              >
                <ChevronRight className="size-4" />
              </button>
            </header>
            <div className="cms-float-panel__list">
              {languages.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={cn(
                    "cms-float-panel__option",
                    currentLang === id && "is-on"
                  )}
                  onClick={() => {
                    onLangChange(id);
                    transition(null);
                  }}
                >
                  <span className="cms-float-panel__code">
                    {languageCodes[id]}
                  </span>
                  <span>{languageLabels[id]}</span>
                  {currentLang === id ? (
                    <Check className="ml-auto size-3.5" strokeWidth={2.5} />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {renderedPanel === "ai" && showAi && onTranslate ? (
          <div className="cms-float-panel__sheet cms-float-panel__sheet--ai">
            <header className="cms-float-panel__head">
              <span className="inline-flex items-center gap-2">
                <SiriOrb
                  size={22}
                  variant={
                    MODELS.find((m) => m.id === model)?.variant ?? "ocean"
                  }
                  isTalking={isTranslating}
                />
                AI Assist
              </span>
              <button
                type="button"
                className="cms-float-panel__btn cms-float-panel__btn--sm"
                onClick={() => transition(null)}
              >
                <ChevronRight className="size-4" />
              </button>
            </header>

            <p className="cms-float-panel__label">Model</p>
            <div className="cms-float-panel__models">
              {MODELS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={cn(
                    "cms-float-panel__model",
                    model === m.id && "is-on"
                  )}
                  onClick={() => setModel(m.id)}
                >
                  <SiriOrb size={30} variant={m.variant} />
                  <strong>{m.name}</strong>
                  <span>{m.desc}</span>
                </button>
              ))}
            </div>

            <p className="cms-float-panel__label">Translate to</p>
            <div className="cms-float-panel__list">
              {languages
                .filter((id) => id !== currentLang)
                .map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={cn(
                      "cms-float-panel__option",
                      target === id && "is-on"
                    )}
                    onClick={() => setTarget(id)}
                  >
                    <span className="cms-float-panel__code">
                      {languageCodes[id]}
                    </span>
                    <span>{languageLabels[id]}</span>
                    {target === id ? (
                      <Check className="ml-auto size-3.5" strokeWidth={2.5} />
                    ) : null}
                  </button>
                ))}
            </div>

            {fields.length > 0 ? (
              <>
                <p className="cms-float-panel__label">Mode</p>
                <div className="cms-float-panel__list">
                  <button
                    type="button"
                    className={cn(
                      "cms-float-panel__option",
                      mode === "all" && "is-on"
                    )}
                    onClick={() => setMode("all")}
                  >
                    <span>All content</span>
                    {mode === "all" ? (
                      <Check className="ml-auto size-3.5" strokeWidth={2.5} />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "cms-float-panel__option",
                      mode === "selective" && "is-on"
                    )}
                    onClick={() => setMode("selective")}
                  >
                    <span>Select fields</span>
                    {mode === "selective" ? (
                      <Check className="ml-auto size-3.5" strokeWidth={2.5} />
                    ) : null}
                  </button>
                </div>
              </>
            ) : null}

            {mode === "selective" && fields.length > 0 ? (
              <>
                <p className="cms-float-panel__label">Fields</p>
                <div className="cms-float-panel__fields">
                  {fields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={cn(
                        "cms-float-panel__chip",
                        selected.has(f.id) && "is-on"
                      )}
                      onClick={() => toggleField(f.id)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            <button
              type="button"
              className="cms-float-panel__go"
              disabled={
                isTranslating ||
                (mode === "selective" && selected.size === 0)
              }
              onClick={() => void runTranslate()}
            >
              {isTranslating ? (
                <SiriOrb
                  size={18}
                  variant={
                    MODELS.find((m) => m.id === model)?.variant ?? "ocean"
                  }
                  isTalking
                />
              ) : (
                <Sparkles className="size-4" />
              )}
              {isTranslating
                ? "Translating…"
                : `Translate → ${languageCodes[target]}`}
            </button>
            <p className="cms-float-panel__hint">
              Applies to local draft only — use Save to persist.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
