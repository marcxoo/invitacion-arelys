'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RsvpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function RsvpModal({ isOpen, onClose }: RsvpModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [count, setCount] = useState(1);

    async function handleSubmit(attending: boolean) {
        if (!name.trim()) {
            setError('Por favor escribe tu nombre');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Save to Supabase
            const { error: dbError } = await supabase
                .from('invitations')
                .insert([
                    {
                        family_name: name, // Using family_name as the display name for public RSVP
                        guest_limit: count, // Self-reported count for public RSVP
                        confirmed_count: attending ? count : 0,
                        status: attending ? 'confirmed' : 'declined',
                        is_public: true
                    }
                ]);

            if (dbError) throw dbError;

            // 2. Local Storage
            localStorage.setItem('rsvp_status', attending ? 'confirmed' : 'declined');
            localStorage.setItem('rsvp_name', name);

            // 3. Success
            if (attending) {
                setStep('success');
            } else {
                alert("Gracias por avisarnos. Lamentamos que no puedas asistir.");
                onClose();
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.message || 'Ocurrió un error al guardar. Intenta de nuevo.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-[#fddbe6] border-2 border-[#f578aa] rounded-[30px] w-full max-w-md p-8 relative shadow-[0_20px_50px_rgba(245,120,170,0.3)] overflow-hidden"
                        style={{ fontFamily: '"Fredoka", sans-serif' }}
                    >
                        {/* POLKA DOT OVERLAY */}
                        <div
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(white 3px, transparent 3px)',
                                backgroundSize: '24px 24px'
                            }}
                        />

                        {/* CLOSE BUTTON */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 text-[#ff4a77] hover:scale-110 transition-transform z-20"
                        >
                            <X size={28} strokeWidth={3} />
                        </button>

                        {step === 'form' ? (
                            <div className="space-y-6 relative z-10">
                                <div className="text-center">
                                    <h2 className="text-[#ff4a77] text-4xl font-bold mb-1">¡Celebremos a Arelys!</h2>
                                    <p className="text-[#f578aa] opacity-90 text-lg">Acompáñanos a festejar sus 3 añitos este Sábado 28 de Febrero.</p>
                                </div>

                                <div className="space-y-5">
                                    {/* NAME INPUT */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[#ff4a77] font-semibold text-lg">
                                            <User size={20} />
                                            Nombre o Familia
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Ej. Familia Pérez"
                                            className="w-full p-4 border-2 border-[#f578aa]/30 rounded-2xl focus:border-[#ff4a77] outline-none bg-white/80 text-[#ff4a77] text-lg font-medium transition-all"
                                        />
                                    </div>

                                    {/* COUNT INPUT */}
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[#ff4a77] font-semibold text-lg">
                                            <Users size={20} />
                                            ¿Cuántos vendrán?
                                        </label>
                                        <div className="flex items-center gap-6 bg-white/50 p-2 rounded-2xl w-fit border-2 border-[#f578aa]/20">
                                            <button
                                                onClick={() => setCount(Math.max(1, count - 1))}
                                                className="w-12 h-12 rounded-xl bg-white text-[#ff4a77] shadow-sm hover:shadow-md active:scale-95 transition-all text-2xl font-bold flex items-center justify-center border border-[#f578aa]/20"
                                            >
                                                -
                                            </button>
                                            <span className="text-3xl font-bold text-[#ff4a77] min-w-[30px] text-center">{count}</span>
                                            <button
                                                onClick={() => setCount(Math.max(1, count + 1))}
                                                className="w-12 h-12 rounded-xl bg-[#ff4a77] text-white shadow-sm hover:shadow-md active:scale-95 transition-all text-2xl font-bold flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-red-500 font-medium text-center bg-red-50 p-2 rounded-lg">{error}</p>}

                                <div className="grid grid-cols-2 gap-4 pt-4">
                                    <button
                                        onClick={() => handleSubmit(false)}
                                        disabled={loading}
                                        className="py-4 px-4 bg-white text-[#f578aa] border-2 border-[#f578aa] rounded-2xl hover:bg-red-50 font-bold transition-all disabled:opacity-50 text-base"
                                    >
                                        No podré ir
                                    </button>
                                    <button
                                        onClick={() => handleSubmit(true)}
                                        disabled={loading}
                                        className="py-4 px-4 bg-[#ff4a77] text-white rounded-2xl shadow-[0_8px_0_#d13b61] active:shadow-none active:translate-y-[8px] font-bold transition-all disabled:opacity-50 text-base"
                                    >
                                        {loading ? 'Enviando...' : '¡Sí, asistiré!'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 space-y-6 relative z-10">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-24 h-24 bg-white text-[#ff4a77] rounded-full flex items-center justify-center mx-auto shadow-xl border-4 border-[#ff4a77]/20"
                                >
                                    <Check size={50} strokeWidth={3} />
                                </motion.div>
                                <div className="space-y-2">
                                    <h2 className="text-[#ff4a77] text-4xl font-bold">¡Genial!</h2>
                                    <p className="text-[#f578aa] text-xl font-medium">
                                        ¡Gracias por confirmar!<br />
                                        Arelys te espera para celebrar juntos sus 3 añitos.
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="py-3 px-10 bg-[#ff4a77] text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg"
                                >
                                    Cerrar
                                </button>
                            </div>
                        )}

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
