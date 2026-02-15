const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpibrqhnrtkonukktjni.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaWJycWhucnRrb251a2t0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTE0MDIsImV4cCI6MjA4NDI2NzQwMn0.a0D2X-6ZfDULYK-uzmjVySBsEeyQaKCthh5vxeAydK4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listTables() {
    console.log('Fetching all tables from /rest/v1/ via fetch...');
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`
            }
        });
        const data = await response.json();
        console.log('Tables visible to API:', Object.keys(data.definitions || {}));

        if (data.definitions && data.definitions.invitations) {
            console.log('SUCCESS: "invitations" table is officially in the schema cache now!');
        } else {
            console.log('FAIL: "invitations" table is still missing from the schema cache.');
        }
    } catch (err) {
        console.error('Error fetching schema:', err.message);
    }
}

listTables();
