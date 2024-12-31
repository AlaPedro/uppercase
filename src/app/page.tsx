'use client'
import { ToastContainer, toast } from 'react-toastify'
import { useState } from 'react'

export default function Home() {
    const [text, setText] = useState<string>('')
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { selectionStart, selectionEnd } = event.target
        const textUppercase = event.target.value.toUpperCase()
        setText(textUppercase)

        // Aguarda a atualização do estado para restaurar o cursor
        setTimeout(() => {
            const textarea = document.getElementById(
                'uppercase'
            ) as HTMLTextAreaElement
            if (textarea) {
                textarea.setSelectionRange(selectionStart, selectionEnd)
            }
        }, 0)
    }

    const handleLineCopy = (line: string) => {
        navigator.clipboard.writeText(line)
        console.log(`Linha copiada: ${line}`)
    }

    const handleCoppyAll = () => {
        navigator.clipboard.writeText(text)
        toast.success('Texto copiado')
    }

    const lines = text.split('\n')
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
                    className="w-4/5 min-h-[400px] outline-none rounded-md p-2 shadow-lg"
                    name="uppercase"
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

                <div className="w-4/5">
                    {text.length > 0 && (
                        <div>
                            <span className="text-white ">
                                Letra para copiar ( linha )
                            </span>
                            {lines.map((line, index) => (
                                <p
                                    key={index}
                                    className="cursor-pointer bg-gray-100 p-2 hover:bg-purple-600 hover:text-white"
                                    onClick={() => handleLineCopy(line)}
                                >
                                    {line || ''}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer />
        </div>
    )
}
