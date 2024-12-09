'use client'

import { useState } from 'react'

export default function Home() {
    const [text, setText] = useState<string>('')
    const uppercaseMusic = () => {
        const textUpercase = text.toUpperCase()
        setText(textUpercase)
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
            <div className="w-full flex flex-col items-center">
                <span className="text-white">
                    Coloque a letra da música aqui
                </span>
                <textarea
                    placeholder="Copie a letra da música aqui!"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-4/5 min-h-[400px] shadow-xl outline-none p-2"
                    name="uppercase"
                    id="uppercase"
                ></textarea>
                {lines.map((line, index) => (
                    <p
                        key={index}
                        className="cursor-pointer bg-gray-100 p-2 hover:bg-purple-100 w-4/5"
                        onClick={() => handleLineCopy(line)}
                    >
                        {line || '-----'}
                    </p>
                ))}
                <button
                    onClick={uppercaseMusic}
                    className="text-white font-semibold bg-orange-500 w-4/5 h-12 rounded-br-md rounded-bl-md shadow-xl hover:bg-orange-600 hover:text-black transition-colors"
                >
                    UPPERCASE
                </button>
            </div>
        </div>
    )
}
