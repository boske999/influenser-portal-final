import './globals.css'
import type { Metadata } from 'next'
import AuthProviderClient from './components/AuthProviderClient'

export const metadata: Metadata = {
  title: 'Allem - Advertising Platform',
  description: 'Allem advertising platform for creators',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProviderClient>
          {children}
        </AuthProviderClient>
      </body>
    </html>
  )
} 