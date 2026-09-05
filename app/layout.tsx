import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = { title: 'FrameFind — Find the film inside the frame', description: 'Identify movies from public Instagram posts and reels.' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="bg-[#111211]"><body>{children}</body></html> }
