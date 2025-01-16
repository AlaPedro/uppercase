'use client'
import { ToastContainer, toast } from 'react-toastify'
import { useRef, useState } from 'react'
import { MinusCircle, PauseCircle, PlayCircle, PlusCircle } from 'lucide-react'

export default function Home() {
    const [text, setText] = useState<string>('')
    const [isScrolling, setIsScrolling] = useState(false)
    const [scrollSpeed, setScrollSpeed] = useState(100) // Velocidade inicial
    const intervalRef = useRef<NodeJS.Timer | null>(null)
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { selectionStart, selectionEnd, scrollTop } = event.target
        const textUppercase = event.target.value.toUpperCase()

        setText(textUppercase)

        // Aguarda a atualização do estado para restaurar o cursor e a rolagem
        setTimeout(() => {
            const textarea = document.getElementById(
                'uppercase'
            ) as HTMLTextAreaElement
            if (textarea) {
                textarea.scrollTop = scrollTop
                textarea.setSelectionRange(selectionStart, selectionEnd)
            }
        }, 0)
    }

    const startStopScrolling = () => {
        const textarea = document.getElementById(
            'uppercase'
        ) as HTMLTextAreaElement

        if (isScrolling) {
            // Parar a rolagem
            setIsScrolling(false)
            if (intervalRef.current) {
                clearInterval(intervalRef.current as NodeJS.Timeout)
                intervalRef.current = null
            }
        } else {
            // Iniciar a rolagem
            if (!text) return
            setIsScrolling(true)

            intervalRef.current = setInterval(() => {
                if (
                    textarea &&
                    textarea.scrollTop <
                        textarea.scrollHeight - textarea.clientHeight
                ) {
                    textarea.scrollTop += 1
                } else {
                    // Parar automaticamente ao alcançar o final
                    setIsScrolling(false)
                    clearInterval(intervalRef.current as NodeJS.Timeout)
                    intervalRef.current = null
                }
            }, scrollSpeed)
        }
    }

    const increaseSpeed = () => {
        setScrollSpeed((prev) => Math.max(prev - 10, 10)) // Reduz o intervalo, aumentando a velocidade
        if (isScrolling) {
            startStopScrolling()
        }
    }

    const decreaseSpeed = () => {
        setScrollSpeed((prev) => prev + 10) // Aumenta o intervalo, reduzindo a velocidade
        if (isScrolling) {
            startStopScrolling()
        }
    }

    const handleCoppyAll = () => {
        navigator.clipboard.writeText(text)
        toast.success('Texto copiado')
    }

    return (
        <div className="min-w-screen min-h-screen bg-bg-ck flex flex-col justify-start items-center gap-10 py-8">
            <h1 className="text-white text-4xl drop-shadow-lg font-semibold">
                Uppercase cante karaokê
            </h1>
            <div className="w-full flex flex-col items-center gap-10">
                <textarea
                    placeholder="Copie a letra da música aqui!"
                    value={text}
                    onChange={handleChange}
                    className="w-4/5 md:w-3/5 min-h-[60vh] outline-none rounded-md p-2 shadow-lg py-10 pb-10 text-lg resize-y scroll-smooth"
                    name="uppercase"
                    ref={textareaRef}
                    id="uppercase"
                ></textarea>
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
                onClick={startStopScrolling}
                className="bg-orange-500 rounded-full p-2 cursor-pointer fixed left-2 top-[200px] drop-shadow-lg"
            >
                {isScrolling ? (
                    <PauseCircle size={20} color="white" />
                ) : (
                    <PlayCircle size={20} color="white" />
                )}
            </button>

            <button
                onClick={increaseSpeed}
                className="bg-orange-500 rounded-full p-2 cursor-pointer fixed left-2 top-[250px] drop-shadow-lg"
            >
                <PlusCircle size={20} color="white" />
            </button>
            <button
                onClick={decreaseSpeed}
                className="bg-orange-500 rounded-full p-2 cursor-pointer fixed left-2 top-[300px] drop-shadow-lg"
            >
                <MinusCircle size={20} color="white" />
            </button>
            <div className="bg-orange-500 w-[36px] h-[36px] rounded-full p-2 cursor-pointer fixed left-2 top-[350px] drop-shadow-lg text-center text-white text-xs flex items-center justify-center">
                <span className="text-[10px]">
                    {(1000 / scrollSpeed).toFixed(2)}x
                </span>
            </div>
            <ToastContainer />
        </div>
    )
}
