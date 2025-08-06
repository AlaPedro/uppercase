"use client";
import { ToastContainer, toast } from "react-toastify";
import { useRef, useState } from "react";
import { Lightbulb, Edit, Mic } from "lucide-react";

export default function Home() {
  const [text, setText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [isSingerMode, setIsSingerMode] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<number[]>([]);

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
        "uppercase"
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
      // Entrando no modo cantor: reseta highlights e scroll
      setHighlightedLines([]);
      setTimeout(() => {
        const div = document.querySelector(
          "[data-singer-mode]"
        ) as HTMLDivElement;
        if (div) {
          div.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement | HTMLTextAreaElement>
  ) => {
    if (isSingerMode && event.key === " ") {
      event.preventDefault();
      const lines = text.split("\n").filter((line) => line.trim() !== "");
      if (highlightedLines.length < lines.length) {
        const newHighlightedLines = [
          ...highlightedLines,
          highlightedLines.length,
        ];
        setHighlightedLines(newHighlightedLines);
      }
    }
  };

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
              overflowY: "auto",
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
            className="px-10 py-2 bg-orange-600 text-white font-bold rounded-md shadow-lg">
            Copiar tudo
          </button>
        )}
      </div>

      <button
        onClick={toggleSingerMode}
        className="bg-orange-500 rounded-full p-2 cursor-pointer fixed left-2 top-[200px] drop-shadow-lg">
        {isSingerMode ? (
          <Edit size={30} color="white" />
        ) : (
          <Mic size={30} color="white" />
        )}
      </button>
      <button
        onClick={handleTheme}
        className="bg-orange-500 rounded-full p-2 cursor-pointer fixed left-2 top-[270px] drop-shadow-lg">
        <Lightbulb size={30} color={isDark ? "white" : "black"} />
      </button>
      <ToastContainer />
    </div>
  );
}
