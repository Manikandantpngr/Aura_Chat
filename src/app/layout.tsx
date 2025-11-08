'use client';

import type { Metadata } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { useEffect, useRef, useState } from 'react';

// Metadata needs to be exported from a server component, but since this is now a client component
// we can define it separately or just remove it if not strictly needed for this page.
// For this fix, we'll assume it's okay to remove the export for simplicity,
// or it could be moved to a parent server component layout if one existed.
// export const metadata: Metadata = {
//   title: 'AuraChat',
//   description: 'A modern, ChatGPT-like interface to powerful cloud-based AI models.',
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auroraOuterRef = useRef<HTMLDivElement>(null);
  const auroraInnerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    document.title = "AuraChat";
    // This logic now runs only on the client, after hydration
    const fontFamilies = ['font-body', 'font-body-alt1', 'font-body-alt2'];
    const randomFamily = fontFamilies[Math.floor(Math.random() * fontFamilies.length)];
    
    // Remove default and add the new random one
    document.body.classList.remove('font-body', 'font-body-alt1', 'font-body-alt2');
    document.body.classList.add(randomFamily);

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Animate aurora background effect
      if (auroraOuterRef.current) {
        auroraOuterRef.current.style.transform = `translate(${clientX - auroraOuterRef.current.clientWidth / 2}px, ${clientY - auroraOuterRef.current.clientHeight / 2}px)`;
      }
      if (auroraInnerRef.current) {
        auroraInnerRef.current.style.transform = `translate(${clientX - auroraInnerRef.current.clientWidth / 2}px, ${clientY - auroraInnerRef.current.clientHeight / 2}px)`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <html lang="en" className="dark" style={{colorScheme: 'dark'}}>
      <head>
        <title>AuraChat</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&family=Bricolage+Grotesque:wght@400;500;600;700&family=Onest:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Add a default font class for server-rendering consistency */}
      <body className="font-body antialiased">
        {isMounted && (
          <div className="aurora-bg">
            <div ref={auroraOuterRef} className="aurora-outer" />
            <div ref={auroraInnerRef} className="aurora-inner" />
          </div>
        )}
        <FirebaseClientProvider>{children}</FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
