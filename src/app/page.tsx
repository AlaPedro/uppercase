"use client";
import { ToastContainer, toast } from "react-toastify";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Lightbulb,
  Edit,
  Mic,
  StickyNote,
  X,
  ChevronDown,
  ChevronUp,
  Music2,
  Play,
  Pause,
} from "lucide-react";

type LyricNote = { id: string; lineIndex: number; text: string };

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function processLyricInput(raw: string) {
  return raw.replace(/-/g, " ").toUpperCase();
}

function restoreWindowScroll(left: number, top: number) {
  window.scrollTo(left, top);
}

/**
 * Evita que o navegador "puxe" a página ao mudar altura do textarea ou restaurar seleção.
 */
function scheduleScrollRestore(left: number, top: number) {
  const apply = () => restoreWindowScroll(left, top);
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(apply);
  });
}

export default function Home() {
  const [text, setText] = useState<string>("");
  const [chordLines, setChordLines] = useState<string[]>([]);
  const [notes, setNotes] = useState<LyricNote[]>([]);
  const [openChordRows, setOpenChordRows] = useState<Set<number>>(
    () => new Set()
  );
  const chordInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const singerPaneRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editorSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [editLineMetrics, setEditLineMetrics] = useState({
    lh: 24,
    padTop: 0,
  });
  const [editTextareaHeight, setEditTextareaHeight] = useState<number | null>(
    null,
  );
  const [viewportMd, setViewportMd] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isSingerMode, setIsSingerMode] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(20); // pixels por segundo (5–50)
  const autoScrollRafRef = useRef<number | null>(null);
  const autoScrollLastTimeRef = useRef<number>(0);

  const lyricLines = text === "" ? [] : text.split("\n");

  const chordRowVisibleForLine = (lineIndex: number) =>
    openChordRows.has(lineIndex) ||
    (chordLines[lineIndex] ?? "").trim() !== "";

  /** Espaço vertical tipo modo cantor: faixa da cifra + folga + letra */
  const editSpacingForChords =
    !isSingerMode &&
    lyricLines.length > 0 &&
    lyricLines.some((_, i) => chordRowVisibleForLine(i));

  const editLineHeightEm = editSpacingForChords ? "2.4em" : "1.5em";

  useEffect(() => {
    const n = text === "" ? 0 : text.split("\n").length;
    setChordLines((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n) return [...prev, ...Array(n - prev.length).fill("")];
      return prev.slice(0, n);
    });
  }, [text]);

  useEffect(() => {
    const n = text === "" ? 0 : text.split("\n").length;
    if (n === 0) return;
    const maxIdx = n - 1;
    setNotes((prev) => {
      const next = prev.map((note) => ({
        ...note,
        lineIndex: Math.min(note.lineIndex, maxIdx),
      }));
      const same =
        next.length === prev.length &&
        next.every(
          (note, i) =>
            note.lineIndex === prev[i].lineIndex && note.id === prev[i].id
        );
      return same ? prev : next;
    });
  }, [text]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setViewportMd(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const syncEditTextareaLayout = useCallback(() => {
    if (isSingerMode) return;
    const surface = editorSurfaceRef.current;
    const ta = textareaRef.current;
    if (!surface || !ta) return;

    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const sStyle = getComputedStyle(surface);
    const padT = parseFloat(sStyle.paddingTop) || 0;
    const padB = parseFloat(sStyle.paddingBottom) || 0;
    const declaredMin = parseFloat(sStyle.minHeight);
    const minInner =
      Number.isFinite(declaredMin) && declaredMin > 0
        ? Math.max(0, declaredMin - padT - padB)
        : (typeof window !== "undefined" ? window.innerHeight * 0.85 : 600) -
          padT -
          padB;

    ta.style.overflow = "hidden";
    ta.style.height = "auto";
    const contentH = ta.scrollHeight;
    const nextH = Math.max(minInner, contentH);
    ta.style.height = `${nextH}px`;

    const tcs = getComputedStyle(ta);
    let lh = parseFloat(tcs.lineHeight);
    const padTop = parseFloat(tcs.paddingTop) || 0;
    if (!Number.isFinite(lh) || lh <= 0) {
      const fs = parseFloat(tcs.fontSize) || 16;
      lh = fs * 1.5;
    }
    setEditLineMetrics({ lh, padTop });
    setEditTextareaHeight(nextH);
    scheduleScrollRestore(scrollX, scrollY);
  }, [isSingerMode]);

  useLayoutEffect(() => {
    if (isSingerMode) return;
    syncEditTextareaLayout();
  }, [viewportMd, text, lyricLines.length, isSingerMode, editSpacingForChords, syncEditTextareaLayout]);

  useLayoutEffect(() => {
    if (isSingerMode) return;
    const surface = editorSurfaceRef.current;
    if (!surface || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => syncEditTextareaLayout());
    ro.observe(surface);
    return () => ro.disconnect();
  }, [isSingerMode, syncEditTextareaLayout]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSingerMode) return;
    const raw = event.target.value;
    const { selectionStart, selectionEnd } = event.target;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const processed = processLyricInput(raw);
    setText(processed);
    setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const max = textarea.value.length;
        const a = Math.min(selectionStart, max);
        const b = Math.min(selectionEnd, max);
        textarea.setSelectionRange(a, b);
        scheduleScrollRestore(scrollX, scrollY);
      }
    }, 0);
  };

  const handleCoppyAll = () => {
    navigator.clipboard.writeText(text);
    toast.success("Letra copiada (sem cifras ou notas)");
  };

  const handleTheme = () => {
    setIsDark(!isDark);
  };

  const toggleSingerMode = () => {
    setIsSingerMode(!isSingerMode);
    if (!isSingerMode) {
      setHighlightedLines([]);
      setIsAutoScroll(false);
      setTimeout(() => {
        const div = singerPaneRef.current;
        if (div) {
          div.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 0);
    }
  };

  const nonEmptyLineCount = text
    .split("\n")
    .filter((line) => line.trim() !== "").length;

  const fileLineIndexForNonEmptyIndex = (targetNonEmpty: number) => {
    const lines = text.split("\n");
    let count = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== "") {
        count++;
        if (count === targetNonEmpty) return i;
      }
    }
    return -1;
  };

  const scrollSingerToNonEmptyIndex = (nonEmptyIndex: number) => {
    const fileIdx = fileLineIndexForNonEmptyIndex(nonEmptyIndex);
    if (fileIdx < 0) return;
    const pane = singerPaneRef.current;
    const row = pane?.querySelector(
      `[data-singer-row="${fileIdx}"]`
    ) as HTMLElement | null;
    row?.scrollIntoView({ block: "center", behavior: "auto" });
  };

  const scrollSingerToTop = () => {
    singerPaneRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };

  const advanceSingerLine = () => {
    setHighlightedLines((prev) => {
      const max = text.split("\n").filter((l) => l.trim() !== "").length;
      if (prev.length >= max) return prev;
      const next = [...prev, prev.length];
      queueMicrotask(() =>
        scrollSingerToNonEmptyIndex(next[next.length - 1])
      );
      return next;
    });
  };

  const retreatSingerLine = () => {
    setHighlightedLines((prev) => {
      if (prev.length === 0) return prev;
      const next = prev.slice(0, -1);
      queueMicrotask(() => {
        if (next.length === 0) scrollSingerToTop();
        else scrollSingerToNonEmptyIndex(next[next.length - 1]);
      });
      return next;
    });
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>
  ) => {
    if (!isSingerMode) return;
    if (event.key === " ") {
      event.preventDefault();
      advanceSingerLine();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      retreatSingerLine();
    }
  };

  const updateChordLine = (lineIndex: number, value: string) => {
    setChordLines((prev) => {
      const next = [...prev];
      while (next.length <= lineIndex) next.push("");
      next[lineIndex] = value;
      return next;
    });
  };

  const revealChordRow = (lineIndex: number) => {
    setOpenChordRows((prev) => new Set(prev).add(lineIndex));
    setTimeout(() => chordInputRefs.current[lineIndex]?.focus(), 0);
  };

  const removeChordRowUi = (lineIndex: number) => {
    updateChordLine(lineIndex, "");
    setOpenChordRows((prev) => {
      const next = new Set(prev);
      next.delete(lineIndex);
      return next;
    });
  };

  const addNote = (lineIndex: number) => {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `n-${Date.now()}-${Math.random()}`;
    setNotes((prev) => [
      ...prev,
      { id, lineIndex, text: "Nova nota" },
    ]);
  };

  const updateNoteText = (id: string, value: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, text: value } : n))
    );
  };

  const removeNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Rolagem automática gradual: ao colorir uma nova linha (espaço), rola a PÁGINA INTEIRA até ela
  useEffect(() => {
    if (
      !isSingerMode ||
      highlightedLines.length === 0 ||
      !singerPaneRef.current ||
      !text.trim()
    )
      return;

    const container = singerPaneRef.current;
    const lines = text.split("\n");
    const lastHighlightedNonEmptyIndex =
      highlightedLines[highlightedLines.length - 1];

    // Índice da linha destacada no array completo (incluindo linhas vazias)
    let lineIndexInFull = 0;
    let count = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() !== "") {
        if (count === lastHighlightedNonEmptyIndex) {
          lineIndexInFull = i;
          break;
        }
        count++;
      }
    }

    const style = getComputedStyle(container);
    const lineHeightPx = parseFloat(style.lineHeight) || 24;
    const containerTop = container.getBoundingClientRect().top + window.scrollY;
    const lineTopOnPage = containerTop + lineIndexInFull * lineHeightPx;
    const offsetFromViewportTop = 120;
    const targetPageScrollY = Math.max(
      0,
      lineTopOnPage - offsetFromViewportTop,
    );

    window.scrollTo({
      top: targetPageScrollY,
      behavior: "smooth",
    });
  }, [isSingerMode, highlightedLines, text]);

  // Rolagem automática contínua (quando ligada)
  useEffect(() => {
    if (!isSingerMode || !isAutoScroll) {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      return;
    }
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;
    const animate = (now: number) => {
      const deltaSec = (now - autoScrollLastTimeRef.current) / 1000;
      autoScrollLastTimeRef.current = now;
      const currentScroll = window.scrollY;
      if (currentScroll >= maxScroll - 1) {
        autoScrollRafRef.current = requestAnimationFrame(animate);
        return;
      }
      const toScroll = Math.min(
        autoScrollSpeed * deltaSec,
        maxScroll - currentScroll,
      );
      window.scrollBy(0, toScroll);
      autoScrollRafRef.current = requestAnimationFrame(animate);
    };
    autoScrollLastTimeRef.current = performance.now();
    autoScrollRafRef.current = requestAnimationFrame(animate);
    return () => {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
      }
    };
  }, [isSingerMode, isAutoScroll, autoScrollSpeed]);

  const renderHighlightedText = () => {
    if (!isSingerMode) return text;

    const lines = text.split("\n");

    return lines
      .map((line, index) => {
        const chord = chordLines[index] ?? "";
        const chordBlock =
          chord.trim() !== ""
            ? `<div style="font-size:0.85em;color:#c084fc;margin-bottom:2px;font-family:ui-monospace,monospace;">${escapeHtml(chord)}</div>`
            : "";

        let nonEmptyIndex = -1;
        let currentNonEmptyCount = 0;

        for (let i = 0; i <= index; i++) {
          if (lines[i].trim() !== "") {
            if (i === index) {
              nonEmptyIndex = currentNonEmptyCount;
            }
            currentNonEmptyCount++;
          }
        }

        const isNonEmpty = line.trim() !== "";
        const isHighlighted =
          isNonEmpty && highlightedLines.includes(nonEmptyIndex);
        const lineHtml = !isNonEmpty
          ? "&nbsp;"
          : isHighlighted
            ? `<span style="color: #ea580c; font-weight: bold;">${escapeHtml(line)}</span>`
            : escapeHtml(line);

        const lineNotes = notes.filter((n) => n.lineIndex === index);
        const notesHtml =
          lineNotes.length > 0
            ? `<div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:8px;">${lineNotes
                .map(
                  (n) =>
                    `<span style="display:inline-block;max-width:220px;padding:8px 10px;background:#fef08a;color:#422006;border-radius:4px;box-shadow:2px 2px 0 rgba(0,0,0,0.15);font-size:0.85em;font-weight:500;transform:rotate(-1deg);">${escapeHtml(n.text)}</span>`
                )
                .join("")}</div>`
            : "";

        return `<div data-singer-row="${index}" style="min-height:1.6em;margin-bottom:4px;">${chordBlock}<div>${lineHtml}</div>${notesHtml}</div>`;
      })
      .join("");
  };

  const editorSurfaceClass = `w-4/5 md:w-3/5 min-h-[85vh] outline-none rounded-md p-2 shadow-lg py-10 pb-10 text-lg resize-y relative ${
    isDark ? "bg-zinc-900 text-zinc-200" : "bg-zinc-100 text-zinc-900"
  }`;

  const editEditorSurfaceClass = `w-4/5 md:w-3/5 min-h-[85vh] outline-none rounded-md p-2 shadow-lg py-10 pb-10 text-lg relative ${
    isDark ? "bg-zinc-900 text-zinc-200" : "bg-zinc-100 text-zinc-900"
  }`;

  const lineGridStyle: React.CSSProperties = {
    backgroundImage: `linear-gradient(90deg, transparent 0%, transparent calc(45ch - 1px), rgba(147, 51, 234, 0.3) calc(45ch - 1px), rgba(147, 51, 234, 0.3) 45ch, transparent 45ch, transparent 100%)`,
    backgroundSize: "100% 1.5em",
    backgroundRepeat: "repeat-y",
    lineHeight: "1.5em",
  };

  return (
    <div className="min-w-screen min-h-screen bg-bg-ck flex flex-col justify-start items-center gap-4 py-4">
      <h1 className="text-white text-4xl drop-shadow-lg font-semibold">
        Uppercase cante karaokê
      </h1>
      <p className="text-zinc-200 text-sm max-w-xl text-center px-4">
        Cifras ficam numa faixa acima da linha (com espaço como no modo cantor
        quando há cifra). Notas ficam ao lado e não entram no texto copiado.
        Use o ícone de música nas linhas que precisarem de acordes (ex.: C F G7
        Am).
      </p>
      <div className="w-full flex flex-col items-center gap-4">
        {isSingerMode ? (
          <div
            ref={singerPaneRef}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            data-singer-mode
            className={`${editorSurfaceClass} cursor-default pr-6`}
            style={{
              ...lineGridStyle,
              whiteSpace: "pre-wrap",
            }}
            dangerouslySetInnerHTML={{ __html: renderHighlightedText() }}
          />
        ) : (
          <div
            ref={editorSurfaceRef}
            className={editEditorSurfaceClass}
            style={{
              ...lineGridStyle,
              backgroundSize: `100% ${editLineHeightEm}`,
              lineHeight: editLineHeightEm,
              overflow: "visible",
            }}
          >
            <div className="grid w-full grid-cols-1 items-start gap-x-3 gap-y-3 md:grid-cols-[minmax(0,1fr)_13.5rem]">
              {(() => {
                const { lh, padTop } = editLineMetrics;
                /** Sobe a faixa da cifra para não encostar na letra */
                const chordStripNudgePx = 8;
                const chordStripTopPx = (i: number) =>
                  padTop + i * lh - chordStripNudgePx;
                const chordStripH = lh * 0.42;
                return (
                  <div className="relative min-w-0 self-start">
                    <textarea
                      placeholder="Cole ou digite a letra aqui. Enter quebra o verso na posição do cursor. Só a página rola."
                      value={text}
                      onChange={handleChange}
                      name="uppercase"
                      ref={textareaRef}
                      id="uppercase"
                      className="relative z-0 min-w-0 w-full resize-none bg-transparent p-0 outline-none border-none uppercase"
                      style={{
                        height: editTextareaHeight ?? undefined,
                        minHeight: editTextareaHeight ? undefined : "10rem",
                        lineHeight: editLineHeightEm,
                        whiteSpace: "pre",
                        overflow: "hidden",
                        overflowWrap: "normal",
                      }}
                      spellCheck={false}
                    />
                    {lyricLines.map((_, i) => {
                      if (!chordRowVisibleForLine(i)) return null;
                      return (
                        <div
                          key={`chord-strip-${i}`}
                          className="pointer-events-none absolute left-0 right-0 z-20 flex items-start gap-1 bg-transparent px-0"
                          style={{
                            top: chordStripTopPx(i),
                            height: chordStripH,
                            fontSize: "0.85em",
                            color: "#c084fc",
                            fontFamily:
                              "ui-monospace, SFMono-Regular, Menlo, monospace",
                          }}
                        >
                          <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-1">
                            <input
                              ref={(el) => {
                                chordInputRefs.current[i] = el;
                              }}
                              type="text"
                              value={chordLines[i] ?? ""}
                              onChange={(e) =>
                                updateChordLine(i, e.target.value)
                              }
                              placeholder="C F G7 Am"
                              className="min-w-0 flex-1 appearance-none border-0 bg-transparent font-mono text-purple-400 shadow-none outline-none ring-0 placeholder:text-purple-400/45 focus:ring-0"
                              style={{
                                lineHeight: 1.35,
                                fontSize: "inherit",
                                backgroundColor: "transparent",
                              }}
                              spellCheck={false}
                              aria-label={`Cifra da linha ${i + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeChordRowUi(i)}
                              title="Remover cifra desta linha"
                              className="shrink-0 rounded p-1 text-purple-400/80 hover:bg-zinc-800/80 hover:text-purple-300"
                              aria-label="Remover cifra desta linha"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {lyricLines.length > 0 && (
                <aside
                  aria-label="Atalhos por linha"
                  className={`relative w-full shrink-0 border-t border-zinc-700/30 pt-3 md:border-t-0 md:border-l md:pl-3 md:pt-0 ${
                    isDark ? "md:border-zinc-600/50" : "md:border-zinc-300"
                  }`}
                  style={
                    viewportMd && editTextareaHeight != null
                      ? {
                          height: editTextareaHeight,
                          minHeight: editTextareaHeight,
                        }
                      : undefined
                  }
                >
                  {lyricLines.map((_, i) => {
                    const lineNotes = notes.filter((n) => n.lineIndex === i);
                    const showChordRow = chordRowVisibleForLine(i);
                    const { lh, padTop } = editLineMetrics;
                    const rowTop = padTop + i * lh;
                    return (
                      <div key={`row-${i}`} className="md:contents">
                        <div
                          className="relative z-[1] mb-3 flex min-h-[2.5rem] flex-col gap-2 rounded-md border border-zinc-700/25 p-2 last:mb-0 md:mb-0 md:min-h-0 md:flex-row md:items-center md:justify-end md:gap-1 md:border-0 md:p-0"
                          style={
                            viewportMd
                              ? {
                                  position: "absolute",
                                  top: rowTop,
                                  left: 0,
                                  right: 0,
                                  height: lh,
                                }
                              : undefined
                          }
                        >
                          <div className="flex shrink-0 items-center gap-0.5">
                            {!showChordRow ? (
                              <button
                                type="button"
                                onClick={() => revealChordRow(i)}
                                title="Adicionar cifra sobre esta linha"
                                className="shrink-0 rounded-md p-1 text-purple-400 hover:bg-zinc-800/80"
                              >
                                <Music2 size={18} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => addNote(i)}
                              title="Adicionar nota (post-it)"
                              className="shrink-0 rounded-md p-1 text-amber-300 hover:bg-zinc-800/80"
                            >
                              <StickyNote size={18} />
                            </button>
                          </div>
                          {lineNotes.length > 0 ? (
                            <div
                              className={`flex flex-col gap-2 md:absolute md:left-full md:top-0 md:z-30 md:ml-3 md:w-40`}
                            >
                              {lineNotes.map((n) => (
                                <div
                                  key={n.id}
                                  className="relative rounded-sm bg-amber-200 p-2 text-xs font-medium text-amber-950 shadow-md ring-1 ring-amber-400/40"
                                  style={{
                                    transform: "rotate(-1.5deg)",
                                    boxShadow: "3px 3px 0 rgba(0,0,0,0.12)",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => removeNote(n.id)}
                                    className="absolute -right-1 -top-1 rounded-full bg-amber-900 p-0.5 text-amber-100 hover:bg-amber-950"
                                    aria-label="Remover nota"
                                  >
                                    <X size={12} />
                                  </button>
                                  <textarea
                                    value={n.text}
                                    onChange={(e) =>
                                      updateNoteText(n.id, e.target.value)
                                    }
                                    className="mt-2 w-full resize-none bg-transparent outline-none"
                                    rows={3}
                                    style={{ lineHeight: "1.35em" }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </aside>
              )}
            </div>
          </div>
        )}
        {text.length > 0 && (
          <button
            onClick={handleCoppyAll}
            className="px-10 py-2 bg-orange-600 text-white font-bold rounded-md shadow-lg"
          >
            Copiar tudo
          </button>
        )}
      </div>

      {isSingerMode && text.length > 0 && (
        <div className="fixed right-3 top-[200px] z-20 flex flex-col gap-2 drop-shadow-lg">
          <button
            type="button"
            onClick={advanceSingerLine}
            disabled={highlightedLines.length >= nonEmptyLineCount}
            title="Próxima linha (espaço)"
            className="rounded-full bg-orange-500 p-2 text-white enabled:hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronDown size={28} />
          </button>
          <button
            type="button"
            onClick={retreatSingerLine}
            disabled={highlightedLines.length === 0}
            title="Linha anterior (backspace)"
            className="rounded-full bg-orange-500 p-2 text-white enabled:hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronUp size={28} />
          </button>
        </div>
      )}

      <button
        onClick={toggleSingerMode}
        className="bg-orange-500 rounded-full p-2 cursor-pointer fixed left-2 top-[200px] drop-shadow-lg"
      >
        {isSingerMode ? (
          <Edit size={30} color="white" />
        ) : (
          <Mic size={30} color="white" />
        )}
      </button>
      <button
        onClick={handleTheme}
        className="bg-orange-500 rounded-full p-2 cursor-pointer fixed left-2 top-[270px] drop-shadow-lg"
      >
        <Lightbulb size={30} color={isDark ? "white" : "black"} />
      </button>
      {isSingerMode && (
        <>
          <div
            className={`fixed right-2 top-[340px] flex flex-col gap-2 p-3 rounded-lg shadow-lg ${
              isDark ? "bg-zinc-800" : "bg-zinc-200"
            }`}
          >
            <span
              className={`text-xs font-medium ${
                isDark ? "text-zinc-300" : "text-zinc-700"
              }`}
            >
              Rolagem auto
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoScroll(!isAutoScroll)}
                title={isAutoScroll ? "Pausar" : "Iniciar"}
                className={`rounded-full p-2 transition-colors ${
                  isAutoScroll
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-orange-500 hover:bg-orange-600"
                }`}
              >
                {isAutoScroll ? (
                  <Pause size={24} color="white" />
                ) : (
                  <Play size={24} color="white" />
                )}
              </button>
              <div className="flex flex-col gap-0.5 min-w-[80px]">
                <label
                  htmlFor="speed"
                  className={`text-[10px] ${
                    isDark ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  Velocidade
                </label>
                <input
                  id="speed"
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={autoScrollSpeed}
                  onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
                  className="w-full h-2 accent-orange-500"
                />
                <span
                  className={`text-[10px] ${
                    isDark ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {autoScrollSpeed} px/s
                </span>
              </div>
            </div>
          </div>
        </>
      )}
      <ToastContainer />
    </div>
  );
}
