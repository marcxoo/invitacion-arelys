'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import AudioPlayer from '@/app/components/AudioPlayer';
import RsvpModal from '@/app/components/RsvpModal';

const LegacyPDFViewer = dynamic(() => import('@/app/components/LegacyPDFViewer'), {
    ssr: false,
});

export default function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
    const resolvedParams = use(params); // Next.js 15+ Params handling
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [isRsvpOpen, setRsvpOpen] = useState(false);
    const [guestName, setGuestName] = useState('');

    useEffect(() => {
        checkSlug();
    }, [resolvedParams.slug]);

    async function checkSlug() {
        const { data, error } = await supabase
            .from('invitations')
            .select('family_name')
            .eq('view_key', resolvedParams.slug)
            .single();

        if (error || !data) {
            setIsValid(false);
        } else {
            setIsValid(true);
            setGuestName(data.family_name);
        }
    }

    const handleOpenMap = () => {
        window.open('https://maps.app.goo.gl/8VHARbVpgyjSV1a36', '_blank');
    };

    if (isValid === false) return notFound();
    if (isValid === null) return <div className="min-h-screen bg-paper flex items-center justify-center text-plum font-vibes text-3xl animate-pulse">Cargando invitación...</div>;

    return (
        <main className="min-h-screen bg-paper flex flex-col items-center pb-20 relative overflow-x-hidden">
            {/* BACKGROUND DECORATION */}
            <div className="absolute inset-0 pointer-events-none opacity-10"
                style={{ backgroundImage: 'radial-gradient(#FFD1DC 2px, transparent 2px)', backgroundSize: '30px 30px' }}
            />

            <AudioPlayer />

            <div className="w-full max-w-4xl relative z-10 my-4 md:my-10 px-0 md:px-4">
                <LegacyPDFViewer
                    file="/invitation.pdf"
                    onOpenRsvp={() => setRsvpOpen(true)}
                    onOpenMap={handleOpenMap}
                />
            </div>

            <RsvpModal
                isOpen={isRsvpOpen}
                onClose={() => setRsvpOpen(false)}
                prefilledName={guestName}
            />
        </main>
    );
}
