const fs = require('fs');

async function checkSchema() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const env = {};
    envContent.split('\n').filter(l => l.includes('=')).forEach(l => {
        const [k, v] = l.split('=');
        env[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
    });

    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        const response = await fetch(`${url}/rest/v1/remboursements?limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const data = await response.json();
        console.log('Remboursement sample:', JSON.stringify(data?.[0], null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkSchema();
