const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpibrqhnrtkonukktjni.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaWJycWhucnRrb251a2t0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTE0MDIsImV4cCI6MjA4NDI2NzQwMn0.a0D2X-6ZfDULYK-uzmjVySBsEeyQaKCthh5vxeAydK4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log("Checking connection...");
    try {
        const { data, error } = await supabase.from('invitations').select('count', { count: 'exact', head: true });

        if (error) {
            console.log("❌ ERROR from Supabase API:");
            console.log(JSON.stringify(error, null, 2));
        } else {
            console.log("✅ SUCCESS! The API sees the table.");
            console.log("Count:", data);
        }
    } catch (e) {
        console.log("❌ EXCEPTION:");
        console.log(e);
    }
}

check();
