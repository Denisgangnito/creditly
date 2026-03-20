/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/utils/supabase/server'
import { requireAdminRole } from '@/utils/admin-security'
import { Currency, Wallet, Document, Time, ArrowUpRight, ArrowDownRight, UserMultiple, CheckmarkFilled, Warning, List, User } from '@carbon/icons-react'

export default async function FinanceAuditPage() {
    // 1. Security check
    await requireAdminRole(['superadmin', 'admin_comptable', 'owner'])
    const supabase = await createClient()

    // 2. Fetch Data with careful handling
    const { data: subs, error: errSubs } = await supabase.from('user_subscriptions').select('*, user:user_id(prenom, nom), plan:abonnements(name, price)')
    const { data: commissions, error: errComm } = await supabase.from('admin_commissions').select('*, admin:admin_id(prenom, nom), loan:loan_id(user_id, prenom_temp:user_id(prenom), nom_temp:user_id(nom))')
    const { data: withdrawals, error: errWith } = await supabase.from('admin_withdrawals').select('*, admin:admin_id(prenom, nom)')

    // 3. Error Diagnostic Screen
    if (errSubs || errComm || errWith) {
        console.error("Finance Audit Error:", { errSubs, errComm, errWith })
        return (
            <div className="p-20 text-center animate-fade-in">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-xl shadow-red-500/10">
                    <Warning size={40} />
                </div>
                <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-4">Erreur de Synchronisation</h1>
                <p className="text-slate-500 italic max-w-md mx-auto mb-10 leading-relaxed">
                    Le grand livre financier ne peut pas être généré car certaines tables système sont manquantes ou inaccessibles.
                </p>
                <div className="glass-panel p-6 bg-slate-900 border-slate-800 inline-block text-left">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Détails techniques :</p>
                    <code className="text-xs text-slate-400 font-mono">
                        {errSubs?.message || errComm?.message || errWith?.message || "Erreur de connexion Supabase"}
                    </code>
                </div>
            </div>
        )
    }

    // 4. Processing Ledger (Journal)
    let totalRevenue = 0
    const journal: any[] = []

    // Subscriptions Revenue
    subs?.forEach((s: any) => {
        const u = s.user as any
        const p = s.plan as any
        const price = Number(p?.price) || 0
        totalRevenue += price
        journal.push({
            date: s.created_at,
            type: 'SUBSCRIPTION',
            amount: price,
            label: `Abonnement ${p?.name || 'Inconnu'}`,
            user: u ? `${u.prenom} ${u.nom}` : 'Utilisateur Inconnu',
            status: s.status === 'active' ? 'COMPLETED' : 'PENDING'
        })
    })

    // Commissions (Outflow/Internal)
    commissions?.forEach((c: any) => {
        const a = c.admin as any
        journal.push({
            date: c.created_at,
            type: 'COMMISSION',
            amount: -Number(c.amount),
            label: `Com. ${c.type.replace('_', ' ')}`,
            user: a ? `${a.prenom} ${a.nom}` : 'Système',
            status: 'PROVISIONED'
        })
    })

    // Withdrawals (Cash out)
    withdrawals?.forEach((w: any) => {
        const a = w.admin as any
        journal.push({
            date: w.created_at,
            type: 'WITHDRAWAL',
            amount: -Number(w.amount),
            label: `Retrait Admin`,
            user: a ? `${a.prenom} ${a.nom}` : 'Admin Inconnu',
            status: w.status === 'approved' ? 'COMPLETED' : w.status === 'rejected' ? 'CANCELLED' : 'PENDING'
        })
    })

    const sortedJournal = journal.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 100)

    const totalWithdrawals = withdrawals?.filter(w => w.status === 'approved').reduce((acc, w) => acc + Number(w.amount), 0) || 0
    const activeProvisions = commissions?.reduce((acc, c) => acc + Number(c.amount), 0) || 0

    return (
        <div className="py-10 md:py-16 animate-fade-in min-h-screen">
            <div className="admin-container">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Currency size={24} />
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black premium-gradient-text tracking-tight uppercase italic">Ledger Financier</h1>
                        </div>
                        <p className="text-slate-500 font-bold italic leading-relaxed">Audit complet des flux monétaires et commissions.</p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-xl">
                        <div className="px-6 py-2.5 rounded-xl bg-blue-600/10 text-blue-500 text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                            TRACABILITÉ TOTALE
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    <div className="glass-panel p-8 bg-slate-900/50 border-slate-800 flex flex-col justify-between group hover:border-emerald-500/30 transition-all shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ArrowUpRight size={100} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Revenus Bruts (Sub)</p>
                            <p className="text-4xl font-black text-emerald-500 italic tracking-tighter">
                                {totalRevenue.toLocaleString('fr-FR')} <span className="text-xs ml-1 uppercase not-italic">FCFA</span>
                            </p>
                        </div>
                    </div>
                    <div className="glass-panel p-8 bg-slate-900/50 border-slate-800 flex flex-col justify-between group hover:border-blue-500/30 transition-all shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><ArrowDownRight size={100} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Commissions Engagées</p>
                            <p className="text-4xl font-black text-blue-500 italic tracking-tighter">
                                {activeProvisions.toLocaleString('fr-FR')} <span className="text-xs ml-1 uppercase not-italic">FCFA</span>
                            </p>
                        </div>
                    </div>
                    <div className="glass-panel p-8 bg-slate-900/50 border-slate-800 flex flex-col justify-between group hover:border-red-500/30 transition-all shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet size={100} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Total Décaissements</p>
                            <p className="text-4xl font-black text-red-500 italic tracking-tighter">
                                {totalWithdrawals.toLocaleString('fr-FR')} <span className="text-xs ml-1 uppercase not-italic">FCFA</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="glass-panel overflow-hidden border-slate-800 shadow-2xl">
                    <div className="px-8 py-6 bg-slate-950/50 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-sm font-black text-white italic tracking-widest uppercase flex items-center gap-3">
                            <List size={20} className="text-blue-500" />
                            Journal des Opérations
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-950/50 border-b border-white/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Type</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Libellé</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Tiers / Agent</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-right">Montant</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest italic text-center">Statut</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {sortedJournal.length > 0 ? sortedJournal.map((entry, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <p className="text-slate-400 font-bold italic">{new Date(entry.date).toLocaleDateString('fr-FR')}</p>
                                            <p className="text-[10px] text-slate-600 font-mono tracking-tighter italic">{new Date(entry.date).toLocaleTimeString('fr-FR')}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg border italic tracking-widest uppercase ${entry.type === 'SUBSCRIPTION' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    entry.type === 'WITHDRAWAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                                }`}>
                                                {entry.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-white font-black italic tracking-tight">{entry.label}</p>
                                        </td>
                                        <td className="px-8 py-5 flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/5 flex items-center justify-center text-[10px] font-black text-blue-500">
                                                <User size={14} />
                                            </div>
                                            <p className="text-slate-300 font-bold italic">{entry.user}</p>
                                        </td>
                                        <td className={`px-8 py-5 text-right font-black italic text-lg tracking-tighter ${entry.amount > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                                            {entry.amount.toLocaleString('fr-FR')} F
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${entry.status === 'COMPLETED' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                        entry.status === 'PENDING' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                                                            'bg-slate-600'
                                                    }`} />
                                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">{entry.status}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <p className="text-slate-600 font-black uppercase italic tracking-[0.3em]">Aucune opération enregistrée</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
