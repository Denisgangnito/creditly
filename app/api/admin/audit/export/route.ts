import { createClient } from '@/utils/supabase/server'
import { requireAdminRole } from '@/utils/admin-security'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Security Check - Only superndmins and admin_comptable can export full audit
        await requireAdminRole(['superadmin', 'admin_comptable', 'owner'])
        
        const supabase = await createClient()

        // Fetch Data for Audit
        const { data: users } = await supabase.from('users').select('*')
        const { data: loans } = await supabase.from('prets').select('*, user:users(nom, prenom, email)')
        const { data: repayments } = await supabase.from('remboursements').select('*, user:users(nom, prenom, email)')
        const { data: subscriptions } = await supabase.from('user_subscriptions').select('*, user:users(nom, prenom, email), plan:abonnements(name, price)')

        // Helper to convert to CSV
        const toCSV = (data: any[]) => {
            if (!data || data.length === 0) return ''
            const headers = Object.keys(data[0])
            const rows = data.map(obj => 
                headers.map(header => {
                    const val = obj[header]
                    if (typeof val === 'object' && val !== null) {
                        return JSON.stringify(val).replace(/"/g, '""')
                    }
                    return `"${String(val).replace(/"/g, '""')}"`
                }).join(',')
            )
            return [headers.join(','), ...rows].join('\n')
        }

        // Combine all into one multi-section CSV (simple approach) or just choose one main table
        // For a true "Audit", let's export Loans as the primary financial document
        const csvContent = toCSV(loans?.map(l => ({
            ID: l.id,
            Client: `${l.user?.prenom} ${l.user?.nom}`,
            Email: l.user?.email,
            Montant: l.amount,
            Payé: l.amount_paid,
            Status: l.status,
            Date_Demande: l.request_date,
            Echeance: l.due_date,
            Phone_Payout: l.payout_phone,
            Network: l.payout_network
        })) || [])

        return new NextResponse(csvContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename=creditly_audit_${new Date().toISOString().split('T')[0]}.csv`,
            },
        })

    } catch (e) {
        console.error('Export error:', e)
        return NextResponse.json({ error: 'Unauthorized or Export failed' }, { status: 401 })
    }
}
