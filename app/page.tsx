'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Use query param for legacy reset action? or just the dashboard
// The legacy code checked URL params for reset. We can handle that if needed, 
// but usually that is for the admin/user debugging.

const LegacyPDFViewer = dynamic(() => import('./components/LegacyPDFViewer'), {
  ssr: false,
});

import AudioPlayer from './components/AudioPlayer';
import RsvpModal from './components/RsvpModal';

export default function Home() {
  const [isRsvpOpen, setRsvpOpen] = useState(false);
  const [invitationLoaded, setInvitationLoaded] = useState(false);

  const handleOpenMap = () => {
    window.open('https://maps.app.goo.gl/2t5b9jRMXL6qbFj9A', '_blank');
  };

  return (
    <main className="min-h-screen bg-[#fddbe6] flex flex-col items-center pb-0 relative overflow-x-hidden">

      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 pointer-events-none opacity-10"
        style={{ backgroundImage: 'radial-gradient(#FFD1DC 2px, transparent 2px)', backgroundSize: '30px 30px' }}
      />

      {invitationLoaded && <AudioPlayer />}

      {/* LOGO LOADER STYLE HEADER (Optional, or just the PDF) */}
      {/* Legacy had a loader with logo. Typescript doesn't need strict loader if we render fast. */}

      <div className="w-full max-w-4xl relative z-10 p-0">
        <LegacyPDFViewer
          file="/invitation.pdf"
          onOpenRsvp={() => setRsvpOpen(true)}
          onOpenMap={handleOpenMap}
          onLoad={() => setInvitationLoaded(true)}
        />
      </div>

      <RsvpModal
        isOpen={isRsvpOpen}
        onClose={() => setRsvpOpen(false)}
      />

    </main>
  );
}
