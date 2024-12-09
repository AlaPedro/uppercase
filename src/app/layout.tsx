import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
})

export const metadata: Metadata = {
    title: 'Uppercase cante karaokê',
    description: 'Uppercase dedicado ao cante karaokê',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="pt-br">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
