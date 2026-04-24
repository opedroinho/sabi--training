import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wilson Sabiá — Trainer App',
  description: 'Personal trainer workout management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
