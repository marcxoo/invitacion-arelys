'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

declare global {
    interface Window {
        pdfjsLib: any;
    }
}

interface LegacyPDFViewerProps {
    file: string;
    onOpenRsvp: () => void;
    onOpenMap: () => void;
    onLoad?: (loaded: boolean) => void;
}

// Icons
const ICON_MAP = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A4B5F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6A4B5F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

export default function LegacyPDFViewer({ file, onOpenRsvp, onOpenMap, onLoad }: LegacyPDFViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [libLoaded, setLibLoaded] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [pdfPages, setPdfPages] = useState(0);

    // Notify parent
    useEffect(() => {
        if (isLoaded && onLoad) {
            onLoad(true);
        }
    }, [isLoaded, onLoad]);

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [showSavedMsg, setShowSavedMsg] = useState(false);
    // State for error handling
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [coordsText, setCoordsText] = useState<{ [key: string]: string }>({});

    // 1. RENDER PDF
    useEffect(() => {
        if (libLoaded) {
            renderPDF();
        }
    }, [libLoaded]);

    const renderPDF = async () => {
        if (!window.pdfjsLib) return;
        // Use local worker to avoid CDN issues or blocking
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.js';

        try {
            setErrorMsg(null);
            let savedPos: any = {};
            try {
                const saved = localStorage.getItem('invitation_coords');
                if (saved) savedPos = JSON.parse(saved);
            } catch (e) { console.error(e); }

            const loadingTask = window.pdfjsLib.getDocument(file);
            const pdf = await loadingTask.promise;

            setPdfPages(pdf.numPages);
            const wrapper = containerRef.current;
            if (!wrapper) return;
            wrapper.innerHTML = '';

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);

                // PAGE CONTAINER
                const div = document.createElement('div');
                // Use absolute positioning for the overlap trick
                div.className = 'relative w-full overflow-hidden flex flex-col items-center justify-center p-0 m-0 bg-[#fddbe6]';
                // Strict zeroing
                div.style.lineHeight = '0';
                div.style.fontSize = '0';
                // Aggressive overlap: each page after the first moves up slightly
                if (pageNum > 1) {
                    div.style.marginTop = '-2px';
                }
                wrapper.appendChild(div);

                const viewport = page.getViewport({ scale: 2 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                canvas.style.width = '100.2%'; // Slightly wider to avoid edge aliasing
                canvas.style.height = 'auto';
                canvas.style.display = 'block';
                canvas.style.margin = '0 auto';
                canvas.style.border = 'none';
                canvas.style.imageRendering = 'crisp-edges'; // Better for text/graphics

                div.appendChild(canvas);
                await page.render({ canvasContext: context, viewport: viewport }).promise;

                // LAYER FOR BUTTONS
                const overlay = document.createElement('div');
                overlay.className = "page-overlay";
                Object.assign(overlay.style, { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 });
                div.appendChild(overlay);

                // Fixed positions from the user's setup
                const defMap = { top: '75.594%', left: '12.558%', width: '32.791%' };
                const defRsvp = { top: '81.185%', left: '47.442%', width: '32.791%' };

                const mapPos = savedPos['map-btn'] || defMap;
                const rsvpPos = savedPos['rsvp-btn'] || defRsvp;

                // Only add buttons to the last page (or page 1 if only 1 page)
                if (pageNum === pdf.numPages) {
                    createButton(overlay, 'map-btn', mapPos.top, mapPos.left, mapPos.width, ICON_MAP, onOpenMap);
                    createButton(overlay, 'rsvp-btn', rsvpPos.top, rsvpPos.left, rsvpPos.width, ICON_CHECK, onOpenRsvp);
                }
            }
            setIsLoaded(true);
        } catch (err: any) {
            console.error('PDF Render Error:', err);
            setErrorMsg(err.message || 'Error al cargar la invitación.');
        }
    };

    // 2. CREATE BUTTON
    const createButton = (parent: HTMLElement, id: string, top: string, left: string, width: string, icon: string, action: () => void) => {
        const btn = document.createElement('div');
        btn.id = id;
        Object.assign(btn.style, {
            position: 'absolute', top, left, width,
            aspectRatio: '1/1', // Ensure container is square
            cursor: 'pointer', zIndex: 20,
            // Invisible by default (hotspot)
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });

        const clickHandler = (e: Event) => {
            if (document.body.classList.contains('is-edit-mode')) {
                e.preventDefault();
                e.stopPropagation();
            } else {
                action();
            }
        };
        btn.addEventListener('click', clickHandler);
        parent.appendChild(btn);
    };

    // 3. EDIT MODE EFFECTS
    useEffect(() => {
        const wrapper = containerRef.current;
        if (!wrapper) return;

        if (editMode) document.body.classList.add('is-edit-mode');
        else document.body.classList.remove('is-edit-mode');

        const buttons = wrapper.querySelectorAll('[id$="-btn"]');
        buttons.forEach((btn: any) => {
            btn.onmousedown = null;
            btn.ontouchstart = null;

            if (editMode) {
                // Resize / Move Style
                btn.style.border = '2px dashed #FFD700'; // Gold
                btn.style.background = 'rgba(255, 20, 147, 0.3)'; // Visible in edit mode
                btn.style.resize = 'horizontal'; // Aspect ratio handles height
                btn.style.overflow = 'visible';

                btn.onmousedown = (e: MouseEvent) => startDrag(e, btn, false);
                btn.ontouchstart = (e: TouchEvent) => startDrag(e, btn, true);
            } else {
                // Normal Style (Invisible)
                btn.style.border = 'none';
                btn.style.background = 'transparent';
                btn.style.resize = 'none';
            }
        });
    }, [editMode, isLoaded]);

    // 4. DRAG / RESIZE LOGIC
    const startDrag = (e: MouseEvent | TouchEvent, el: HTMLElement, isTouch: boolean) => {
        const rect = el.getBoundingClientRect();
        const clientX = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

        const isResize = clientX > rect.right - 40;
        e.preventDefault();

        let pos3 = clientX;
        let pos4 = clientY;

        const moveHandler = (e: MouseEvent | TouchEvent) => {
            const cx = isTouch ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
            const cy = isTouch ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;

            if (isResize) {
                const diffX = cx - pos3;
                const newWidth = el.offsetWidth + diffX;
                if (newWidth > 20) {
                    el.style.width = newWidth + "px";
                }
            } else {
                const pos1 = pos3 - cx;
                const pos2 = pos4 - cy;
                el.style.top = (el.offsetTop - pos2) + "px";
                el.style.left = (el.offsetLeft - pos1) + "px";
            }

            pos3 = cx;
            pos4 = cy;
            updateCoords(el);
        };

        const upHandler = () => {
            document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', moveHandler);
            document.removeEventListener(isTouch ? 'touchend' : 'mouseup', upHandler);
        };
        document.addEventListener(isTouch ? 'touchmove' : 'mousemove', moveHandler, { passive: false });
        document.addEventListener(isTouch ? 'touchend' : 'mouseup', upHandler);
    };

    const updateCoords = (el: HTMLElement) => {
        const parent = el.offsetParent as HTMLElement;
        if (!parent) return;

        // Calculate Percentages
        const l = (el.offsetLeft / parent.offsetWidth) * 100;
        const t = (el.offsetTop / parent.offsetHeight) * 100;
        const w = (el.offsetWidth / parent.offsetWidth) * 100;
        const format = (v: number) => v.toFixed(3) + '%';

        setCoordsText(prev => ({
            ...prev,
            [el.id]: `Top:${format(t)} Left:${format(l)} Width:${format(w)}`
        }));

        const saved = JSON.parse(localStorage.getItem('invitation_coords') || '{}');
        saved[el.id] = { top: format(t), left: format(l), width: format(w) };
        localStorage.setItem('invitation_coords', JSON.stringify(saved));
    };

    const handleSave = () => {
        const nextMode = !editMode;
        setEditMode(nextMode);
        if (nextMode) {
            document.body.classList.add('is-edit-mode');
        } else {
            document.body.classList.remove('is-edit-mode');
            setShowSavedMsg(true);
            setTimeout(() => setShowSavedMsg(false), 2000);
        }
    };

    const handleReset = () => {
        if (confirm('¿Restablecer posiciones originales?')) {
            localStorage.removeItem('invitation_coords');
            window.location.reload();
        }
    };

    return (
        <>
            <Script src="/js/pdf.min.js" onLoad={() => setLibLoaded(true)} onError={() => setErrorMsg("No se pudo cargar la librería PDF.")} />

            {showSavedMsg && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] bg-green-500 text-white px-8 py-4 rounded-xl shadow-2xl font-bold text-xl">
                    ¡GUARDADO! ✅
                </div>
            )}

            {/* Hidden development buttons - Only rendered in Development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 opacity-0 pointer-events-none hover:opacity-100 transition-opacity">
                    {editMode && (
                        <button onClick={handleReset} className="bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg uppercase">
                            Reiniciar
                        </button>
                    )}
                    <button onClick={handleSave} className={`px-4 py-3 rounded-full shadow-lg font-bold text-xs uppercase ${editMode ? 'bg-green-500 text-white' : 'bg-plum text-white border border-gold/30'}`}>
                        {editMode ? '💾 FINALIZAR' : '🛠 MOVER BOTONES'}
                    </button>
                </div>
            )}

            {editMode && (
                <div className="fixed bottom-24 right-4 z-[100] bg-black/90 text-white p-4 rounded-xl font-mono text-[10px] shadow-2xl border border-gold/20 backdrop-blur-md w-56">
                    <div className="text-gold font-bold mb-2 border-b border-white/10 pb-1">PANEL DE CONTROL</div>
                    <div className="space-y-2">
                        {Object.entries(coordsText).map(([k, v]) => (
                            <div key={k} className="bg-white/5 p-1 rounded">
                                <span className="text-yellow-400 block font-bold uppercase">{k}</span>
                                <div className="text-[9px] opacity-80">{v}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="w-full flex flex-col items-center bg-[#fddbe6] p-0 m-0 min-h-screen">
                {!isLoaded && (
                    <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#fddbe6] overflow-hidden">
                        {/* POLKA DOT & CHEVRON BACKGROUND overlay */}
                        <div
                            className="absolute inset-0 z-0 opacity-20"
                            style={{
                                backgroundColor: '#fddbe6',
                                backgroundImage: `
                                    linear-gradient(135deg, white 25%, transparent 25%),
                                    linear-gradient(225deg, white 25%, transparent 25%),
                                    linear-gradient(45deg, white 25%, transparent 25%),
                                    linear-gradient(315deg, white 25%, transparent 25%)
                                `,
                                backgroundPosition: '10px 0, 10px 0, 0 0, 0 0',
                                backgroundSize: '20px 20px',
                                backgroundRepeat: 'repeat'
                            }}
                        />
                        <div
                            className="absolute inset-0 z-0 opacity-40"
                            style={{
                                backgroundImage: 'radial-gradient(#ffffff 4px, transparent 4px)',
                                backgroundSize: '40px 40px'
                            }}
                        />

                        {/* MAGICAL PARTICLES (Stars, Ears, Dots) */}
                        {[...Array(20)].map((_, i) => {
                            const size = Math.random() * 15 + 10;
                            const type = i % 3; // 0: Dot, 1: Star, 2: Mickey Head
                            const color = i % 2 === 0 ? 'white' : '#ff4a77';
                            return (
                                <div
                                    key={i}
                                    className={`absolute opacity-50 animate-sparkle flex items-center justify-center`}
                                    style={{
                                        width: size + 'px',
                                        height: size + 'px',
                                        left: Math.random() * 100 + '%',
                                        top: Math.random() * 100 + '%',
                                        animationDelay: Math.random() * 5 + 's',
                                        animationDuration: Math.random() * 4 + 2 + 's'
                                    }}
                                >
                                    {type === 0 && <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: color }} />}
                                    {type === 1 && (
                                        <svg viewBox="0 0 24 24" fill={color} width="100%" height="100%">
                                            <path d="M12 1.7L14.8 8.6L22.2 9.2L16.6 14.1L18.2 21.3L12 17.5L5.8 21.3L7.4 14.1L1.8 9.2L9.2 8.6L12 1.7Z" />
                                        </svg>
                                    )}
                                    {type === 2 && (
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            {/* Mickey Head */}
                                            <div className={`absolute w-1/2 h-1/2 rounded-full bottom-0`} style={{ backgroundColor: color }} />
                                            {/* Ears */}
                                            <div className={`absolute w-1/3 h-1/3 rounded-full top-0 left-0`} style={{ backgroundColor: color }} />
                                            <div className={`absolute w-1/3 h-1/3 rounded-full top-0 right-0`} style={{ backgroundColor: color }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* THE BOW WITH GLOW */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="absolute inset-0 bg-[#f578aa]/30 blur-3xl rounded-full scale-150 animate-pulse" />
                            <img
                                src="/bow.png"
                                alt="Cargando..."
                                className="w-40 h-auto animate-magical-bow drop-shadow-[0_10px_20px_rgba(255,74,119,0.3)] relative z-10"
                            />
                        </div>

                        <div className="relative z-10 mt-10 flex flex-col items-center px-4 text-center">
                            {errorMsg ? (
                                <div className="bg-white/90 p-6 rounded-2xl shadow-xl max-w-sm border-2 border-red-200">
                                    <h3 className="text-red-500 font-bold text-xl mb-2">¡Ups! Hubo un problema</h3>
                                    <p className="text-gray-600 mb-4 text-sm">{errorMsg}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="bg-[#ff4a77] text-white px-6 py-2 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="text-[#ff4a77] text-4xl font-semibold animate-pulse tracking-tight select-none"
                                        style={{ fontFamily: '"Fredoka", sans-serif', textShadow: '0 2px 10px rgba(255,255,255,0.8)' }}>
                                        Cargando Invitación...
                                    </div>
                                    {/* NEW NEON LOADING BAR */}
                                    <div className="w-64 h-4 bg-white/20 rounded-full mt-10 overflow-hidden border border-white/40 relative backdrop-blur-sm shadow-[0_0_20px_rgba(255,74,119,0.4)]">
                                        {/* Base Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#ff4a77] via-[#f578aa] to-[#ff4a77] opacity-80" />

                                        {/* Moving Glow Bubble */}
                                        <div className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-magic-flow" />

                                        {/* Inner Sparkles in Bar */}
                                        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
                                    </div>
                                    <p className="mt-4 text-[#f578aa] text-sm font-medium opacity-80 animate-pulse">
                                        Preparando magia... (Puede tardar un poco)
                                    </p>
                                </>
                            )}
                        </div>

                        <style jsx>{`
                            @keyframes magic-flow {
                                0% { transform: translate3d(-100%, 0, 0); }
                                50% { transform: translate3d(200%, 0, 0); }
                                100% { transform: translate3d(-100%, 0, 0); }
                            }
                            .animate-magic-flow {
                                animation: magic-flow 3s ease-in-out infinite;
                                will-change: transform;
                            }
                            @keyframes magical-bow {
                                0%, 100% { transform: translate3d(0, 0, 0) rotate(-5deg) scale3d(1, 1, 1); }
                                33% { transform: translate3d(0, -15px, 0) rotate(5deg) scale3d(1.05, 1.05, 1); }
                                66% { transform: translate3d(0, 5px, 0) rotate(-3deg) scale3d(1.02, 1.02, 1); }
                            }
                            .animate-magical-bow {
                                animation: magical-bow 5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
                                will-change: transform;
                            }
                            @keyframes sparkle {
                                0%, 100% { transform: translate3d(0, 0, 0) scale(0); opacity: 0; }
                                25% { opacity: 0.6; }
                                50% { transform: translate3d(0, -40px, 0) scale(1.2) rotate(180deg); opacity: 0.8; }
                                75% { opacity: 0.6; }
                            }
                            .animate-sparkle {
                                animation: sparkle 4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                will-change: transform;
                            }
                            @keyframes progress-shimmer {
                                0% { transform: translate3d(-100%, 0, 0); }
                                100% { transform: translate3d(100%, 0, 0); }
                            }
                            .animate-progress-shimmer {
                                animation: progress-shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                will-change: transform;
                            }
                        `}</style>
                    </div>
                )}

                <div ref={containerRef} className={`${!isLoaded ? 'hidden' : 'grid'} grid-cols-1 w-full max-w-2xl bg-[#fddbe6] shadow-2xl overflow-visible p-0 m-0`}></div>
            </div>
        </>
    );
}
