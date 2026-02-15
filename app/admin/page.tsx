'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Helper to mimic legacy behavior
export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(true);
    const [password, setPassword] = useState('');

    // Data
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Metrics
    const [stats, setStats] = useState({ responses: 0, people: 0, declined: 0 });

    useEffect(() => {
        if (isAuthenticated) fetchGuests();
    }, [isAuthenticated]);

    async function fetchGuests() {
        setLoading(true);
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            alert('Error: ' + error.message);
            setLoading(false);
            return;
        }

        const allVotes = data || [];

        // Deduplication (Last Vote Wins) - matching legacy logic
        const uniqueGuests = new Map();
        for (const vote of allVotes) {
            if (!vote.family_name) continue;
            // In legacy: vote.nombre. In new DB: vote.family_name
            const key = vote.family_name.trim().toLowerCase();
            if (!uniqueGuests.has(key)) {
                uniqueGuests.set(key, vote);
            }
        }
        const finalGuests = Array.from(uniqueGuests.values());
        setGuests(finalGuests);

        // Calc Stats
        const yesGroups = finalGuests.filter(g => g.status === 'confirmed');
        const noResponse = finalGuests.filter(g => g.status === 'declined');
        // Sum confirmed_count (legacy: cantidad)
        const totalPax = yesGroups.reduce((acc, g) => acc + (g.confirmed_count || 1), 0);

        setStats({
            responses: yesGroups.length,
            people: totalPax,
            declined: noResponse.length
        });

        setLoading(false);
    }

    async function handleDeleteAll() {
        if (prompt("ADMIN PASSWORD:") !== "arelys3") return alert("Incorrecto");
        if (!confirm("¿Estás seguro?")) return;
        await supabase.from('invitations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        fetchGuests();
    }

    // Removal of login check as requested by user
    /*
    if (!isAuthenticated) {
        ...
    }
    */

    return (
        <div className="min-h-screen flex flex-col items-center p-6 bg-[#fddbe6] relative overflow-x-hidden"
            style={{ fontFamily: '"Fredoka", sans-serif' }}>

            {/* POLKA DOT BACKGROUND */}
            <div
                className="absolute inset-0 z-0 opacity-40 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#ffffff 4px, transparent 4px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* MASTHEAD */}
            <div className="relative z-10 text-center mb-10 mt-4">
                <img src="/bow.png" className="w-20 h-auto mx-auto mb-2" alt="Bow" />
                <h1 className="text-4xl md:text-5xl font-bold text-[#ff4a77] drop-shadow-sm">Arelys</h1>
                <div className="bg-[#ff4a77] text-white px-6 py-1 rounded-full text-sm font-bold uppercase tracking-widest mt-2 inline-block">
                    Reporte de Asistencia
                </div>
            </div>

            {/* METRICS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl relative z-10 mb-10">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[30px] border-2 border-[#f578aa]/30 shadow-xl text-center group hover:scale-105 transition-all">
                    <span className="text-[#f578aa] font-bold uppercase text-xs tracking-wider block mb-2">Confirmados</span>
                    <div className="text-6xl font-black text-[#ff4a77]">{stats.responses}</div>
                    <div className="text-sm text-[#f578aa] mt-2 font-medium">Familias</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[30px] border-4 border-[#ff4a77] shadow-[0_15px_30px_rgba(255,74,119,0.2)] text-center scale-110 relative z-20 overflow-hidden">
                    {/* BUBBLE EFFECT */}
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#fddbe6] rounded-full opacity-50" />
                    <span className="text-[#ff4a77] font-bold uppercase text-xs tracking-wider block mb-2">Total de Personas</span>
                    <div className="text-7xl font-black text-[#ff4a77]">{stats.people}</div>

                </div>
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-[30px] border-2 border-[#f578aa]/30 shadow-xl text-center group hover:scale-105 transition-all">
                    <span className="text-gray-400 font-bold uppercase text-xs tracking-wider block mb-2">Declinaron</span>
                    <div className="text-6xl font-black text-gray-400">{stats.declined}</div>
                    <div className="text-sm text-gray-400 mt-2 font-medium">Familias</div>
                </div>
            </div>

            {/* TABLE */}
            <div className="w-full max-w-5xl bg-white/90 backdrop-blur-md rounded-[40px] border-2 border-[#f578aa]/30 overflow-hidden shadow-2xl relative z-10 mb-12">
                <div className="bg-[#f578aa] p-6 text-white flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Lista de Invitados</h2>
                    <div className="bg-white/20 px-4 py-1 rounded-full text-xs font-bold">Sábado 28 de Febrero</div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#fddbe6]/50 text-[#ff4a77] text-xs uppercase font-bold border-b border-[#f578aa]/20">
                            <tr>
                                <th className="p-6">Nombre / Familia</th>
                                <th className="p-6 text-center">Personas</th>
                                <th className="p-6 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#fddbe6]">
                            {guests.length === 0 ? (
                                <tr><td colSpan={3} className="p-10 text-center text-[#f578aa] italic opacity-60">Esperando confirmaciones...</td></tr>
                            ) : (
                                guests.map((g, i) => {
                                    const isYes = g.status === 'confirmed';
                                    return (
                                        <tr key={i} className={`hover:bg-[#fddbe6]/20 transition-colors ${!isYes ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            <td className="p-6">
                                                <div className="font-bold text-xl text-[#ff4a77]">{g.family_name}</div>
                                                <div className="text-xs text-[#f578aa]/60">ID: {g.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                {isYes ? (
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#ff4a77] text-white text-xl font-black shadow-lg">
                                                        {g.confirmed_count}
                                                    </div>
                                                ) : <span className="text-[#f578aa]">-</span>}
                                            </td>
                                            <td className="p-6 text-right">
                                                {isYes ? (
                                                    <span className="bg-green-100 text-green-600 px-4 py-1.5 rounded-full text-sm font-bold border border-green-200">asistirá</span>
                                                ) : (
                                                    <span className="bg-red-50 text-red-500 px-4 py-1.5 rounded-full text-sm font-bold border border-red-100">no podrá</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ACTION BAR */}
            <div className="flex flex-col items-center gap-6 w-full max-w-xl relative z-10">
                <button
                    onClick={fetchGuests}
                    className="w-full bg-[#f578aa] text-white py-5 rounded-[25px] font-bold text-xl shadow-[0_10px_25px_rgba(245,120,170,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                    Actualizar Reporte
                </button>

                <div className="flex flex-wrap justify-center gap-4 border-t-2 border-[#f578aa]/20 pt-8 w-full">
                    <button
                        onClick={handleDeleteAll}
                        className="px-6 py-2 rounded-xl text-xs font-bold text-gray-400 border-2 border-dashed border-gray-300 hover:bg-red-50 hover:text-red-500 hover:border-red-500 transition-all"
                    >
                        Limpiar todos los datos
                    </button>
                    <button
                        onClick={() => {
                            const url = window.location.origin;
                            navigator.clipboard.writeText(url).then(() => alert("¡Enlace copiado!"));
                        }}
                        className="px-6 py-2 rounded-xl text-xs font-bold text-[#f578aa] border-2 border-[#f578aa] hover:bg-[#f578aa] hover:text-white transition-all"
                    >
                        Copiar Link Invitación
                    </button>
                </div>
            </div>

        </div>
    );
}
