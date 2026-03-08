/* test supabase */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dbunwqgfakqcazjkyagd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRidW53cWdmYWtxY2F6amt5YWdkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzE3NjY1MywiZXhwIjoyMDgyNzUyNjUzfQ.YlwBx17nJtnRz1cftDwA8gybVE7kzucIs55ivrxNuEA'
);

async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(5);
  console.log("Users:", error || data);

  const { data: qData, error: qError } = await supabase.rpc('check_user_role', { target_roles: ['superadmin'] });
  console.log("check_user_role:", qError || qData);
}

test();
