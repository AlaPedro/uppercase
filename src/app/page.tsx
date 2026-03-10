"use client";
import { ToastContainer, toast } from "react-toastify";
import { useRef, useState, useEffect } from "react";
import {
  Lightbulb,
  Edit,
  Mic,
  ChevronRight,
  Undo2,
  Play,
  Pause,
} from "lucide-react";

export default function Home() {
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const singerContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isSingerMode, setIsSingerMode] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);
  const [isAutoScroll, setIsAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(20); // pixels por segundo (5–50)
  const autoScrollRafRef = useRef<number | null>(null);
  const autoScrollLastTimeRef = useRef<number>(0);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isSingerMode) return; // Não permite edição no modo cantor

    const { selectionStart, selectionEnd, scrollTop } = event.target;
    // Substitui hífens por espaços e converte para maiúsculas
    const textWithoutHyphens = event.target.value.replace(/-/g, " ");
    const textUppercase = textWithoutHyphens.toUpperCase();

    setText(textUppercase);

    // Aguarda a atualização do estado para restaurar o cursor e a rolagem
    setTimeout(() => {
      const textarea = document.getElementById(
        "uppercase",
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.scrollTop = scrollTop;
        textarea.setSelectionRange(selectionStart, selectionEnd);
      }
    }, 0);
  };

  const handleCoppyAll = () => {
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado");
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
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    }
  };

  const advanceLine = () => {
    const lines = text.split("\n").filter((line) => line.trim() !== "");
    if (highlightedLines.length < lines.length) {
      setHighlightedLines([...highlightedLines, highlightedLines.length]);
    }
  };

  const clearLastLine = () => {
    if (highlightedLines.length > 0) {
      setHighlightedLines(highlightedLines.slice(0, -1));
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>,
  ) => {
    if (!isSingerMode) return;
    if (event.key === " ") {
      event.preventDefault();
      advanceLine();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      clearLastLine();
    }
  };

  // Rolagem automática gradual: ao colorir uma nova linha (espaço), rola a PÁGINA INTEIRA até ela
  useEffect(() => {
    if (
      !isSingerMode ||
      highlightedLines.length === 0 ||
      !singerContainerRef.current ||
      !text.trim()
    )
      return;

    const container = singerContainerRef.current;
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
        if (line.trim() === "") return line;

        // Encontra o índice da linha atual na lista de linhas não vazias
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

        const isHighlighted = highlightedLines.includes(nonEmptyIndex);
        return isHighlighted
          ? `<span style="color: #ea580c; font-weight: bold;">${line}</span>`
          : line;
      })
      .join("\n");
  };

  return (
    <div className="min-w-screen min-h-screen bg-bg-ck flex flex-col justify-start items-center gap-4 py-4">
      <h1 className="text-white text-4xl drop-shadow-lg font-semibold">
        Uppercase cante karaokê
      </h1>
      <div className="w-full flex flex-col items-center gap-4">
        {isSingerMode ? (
          <div
            ref={singerContainerRef}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            data-singer-mode
            className={`w-4/5 md:w-3/5 min-h-[85vh] outline-none rounded-md p-2 shadow-lg py-10 pb-10 text-lg resize-y scroll-smooth relative cursor-default ${
              isDark ? "bg-zinc-900 text-zinc-200" : "bg-zinc-100 text-zinc-900"
            }`}
            style={{
              backgroundImage: `linear-gradient(90deg, transparent 0%, transparent calc(45ch - 1px), rgba(147, 51, 234, 0.3) calc(45ch - 1px), rgba(147, 51, 234, 0.3) 45ch, transparent 45ch, transparent 100%)`,
              backgroundSize: "100% 1.5em",
              backgroundRepeat: "repeat-y",
              lineHeight: "1.5em",
              whiteSpace: "pre-wrap",
            }}
            dangerouslySetInnerHTML={{ __html: renderHighlightedText() }}
          />
        ) : (
          <textarea
            placeholder="Copie a letra da música aqui!"
            value={text}
            onChange={handleChange}
            className={`w-4/5 md:w-3/5 min-h-[85vh] outline-none rounded-md p-2 shadow-lg py-10 pb-10 text-lg resize-y scroll-smooth relative ${
              isDark ? "bg-zinc-900 text-zinc-200" : "bg-zinc-100 text-zinc-900"
            }`}
            style={{
              backgroundImage: `linear-gradient(90deg, transparent 0%, transparent calc(45ch - 1px), rgba(147, 51, 234, 0.3) calc(45ch - 1px), rgba(147, 51, 234, 0.3) 45ch, transparent 45ch, transparent 100%)`,
              backgroundSize: "100% 1.5em",
              backgroundRepeat: "repeat-y",
              lineHeight: "1.5em",
            }}
            name="uppercase"
            ref={textareaRef}
            id="uppercase"
          />
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
          <button
            onClick={advanceLine}
            title="Próxima linha (Espaço)"
            className="bg-orange-500 rounded-full p-2 cursor-pointer fixed right-2 top-[200px] drop-shadow-lg hover:bg-orange-600 transition-colors"
          >
            <ChevronRight size={30} color="white" />
          </button>
          <button
            onClick={clearLastLine}
            title="Limpar última linha (Backspace)"
            className="bg-orange-500 rounded-full p-2 cursor-pointer fixed right-2 top-[270px] drop-shadow-lg hover:bg-orange-600 transition-colors"
          >
            <Undo2 size={30} color="white" />
          </button>
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
