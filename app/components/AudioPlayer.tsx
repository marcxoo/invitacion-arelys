'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AudioPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(e => console.log("Audio play failed:", e));
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const playPromise = audioRef.current?.play();
        if (playPromise !== undefined) {
            playPromise.then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        }
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            if (!isScrolling) setIsScrolling(true);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
            scrollTimeout.current = setTimeout(() => {
                setIsScrolling(false);
            }, 1000);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        };
    }, [isScrolling]);

    const constraintsRef = useRef(null);

    return (
        <>
            <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[190]" />
            <motion.div
                drag
                dragMomentum={true}
                dragElastic={0.2}
                dragConstraints={constraintsRef}
                className="fixed top-6 right-6 z-[200]"
                style={{
                    touchAction: 'none',
                    opacity: isScrolling ? 0.3 : 1,
                    scale: isScrolling ? 0.85 : 1,
                    transition: 'opacity 0.4s, scale 0.4s'
                }}
            >
                <audio ref={audioRef} src="/metadata.mp3" loop />

                <button
                    onClick={togglePlay}
                    className={`
                    relative w-16 h-16 rounded-full border-2 border-[#f578aa]
                    flex items-center justify-center overflow-hidden
                    shadow-[0_8px_25px_rgba(245,120,170,0.5)]
                    active:scale-95 transition-all duration-300
                    ${isPlaying ? 'bg-white' : 'bg-[#fddbe6]'}
                `}
                >
                    {/* MINNIE PATTERN BACKGROUND */}
                    <div
                        className="absolute inset-0 opacity-15"
                        style={{
                            backgroundImage: 'radial-gradient(#ff4a77 2px, transparent 2px)',
                            backgroundSize: '12px 12px'
                        }}
                    />

                    {/* ICON */}
                    <div className="relative z-10 text-[#ff4a77]">
                        {isPlaying ? (
                            <svg className="animate-pulse" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07" />
                            </svg>
                        )}
                    </div>

                    {/* PULSING EFFECT */}
                    {isPlaying && (
                        <div className="absolute inset-0 animate-magical-pulse pointer-events-none">
                            <div className="w-full h-full rounded-full border-4 border-[#ff4a77] opacity-20" />
                        </div>
                    )}
                </button>

                <style jsx>{`
                @keyframes magical-pulse {
                    0% { transform: scale(1); opacity: 0.5; }
                    100% { transform: scale(1.8); opacity: 0; }
                }
                .animate-magical-pulse {
                    animation: magical-pulse 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>
            </motion.div>
        </>
    );
}
