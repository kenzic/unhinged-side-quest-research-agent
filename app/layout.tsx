import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Unhinged Intern - AI Research Agent',
  description: 'An AI research agent that gets distracted by side quests',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
