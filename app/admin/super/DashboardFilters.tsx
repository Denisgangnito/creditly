/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Filter, Calendar } from '@carbon/icons-react'

export function DashboardFilters({ currentMonth, currentYear, currentPeriod }: { currentMonth: number, currentYear: number, currentPeriod: string }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    function updateParams(key: string, value: string) {
        const params = new URLSearchParams(searchParams.toString())
        params.set(key, value)
        router.push(`${pathname}?${params.toString()}`)
    }

    const months = [
        "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
        "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ]

    return (
        <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-xl">
            {/* Period Selector */}
            <div className="flex p-1 bg-slate-950/50 rounded-xl border border-white/5">
                {['month', 'week'].map((p) => (
                    <button
                        key={p}
                        onClick={() => updateParams('period', p)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentPeriod === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {p === 'month' ? 'Mensuel' : 'Cette Semaine'}
                    </button>
                ))}
            </div>

            {currentPeriod === 'month' && (
                <>
                    <select
                        value={currentMonth}
                        onChange={(e) => updateParams('month', e.target.value)}
                        className="bg-slate-800 rounded-xl px-4 py-2 text-slate-300 font-black text-[10px] uppercase tracking-widest italic outline-none border border-white/5 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={currentYear}
                        onChange={(e) => updateParams('year', e.target.value)}
                        className="bg-slate-800 rounded-xl px-4 py-2 text-slate-300 font-black text-[10px] uppercase tracking-widest italic outline-none border border-white/5 appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </>
            )}

            {currentPeriod === 'week' && (
                <div className="flex bg-slate-800 rounded-xl px-4 py-2 text-slate-400 font-black text-[10px] uppercase tracking-widest italic items-center gap-2">
                    <Calendar size={14} /> 7 Derniers Jours
                </div>
            )}
        </div>
    )
}
