'use client'

import { useState } from 'react'

export default function Home() {
    const [text, setText] = useState<string>('')
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textUppercase = event.target.value.toUpperCase()
        setText(textUppercase)
    }
    const handleLineCopy = (line: string) => {
        navigator.clipboard.writeText(line)
        console.log(`Linha copiada: ${line}`)
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
                    className="w-4/5 min-h-[400px] shadow-xl outline-none p-2"
                    name="uppercase"
                    id="uppercase"
                ></textarea>
                <div className="w-4/5">
                    <span className="text-white ">Letra para copiar</span>
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
            </div>
        </div>
    )
}
