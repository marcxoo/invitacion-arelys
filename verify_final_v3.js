const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bpibrqhnrtkonukktjni.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaWJycWhucnRrb251a2t0am5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2OTE0MDIsImV4cCI6MjA4NDI2NzQwMn0.a0D2X-6ZfDULYK-uzmjVySBsEeyQaKCthh5vxeAydK4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verify() {
    console.log('Verifying "invitations" table again...');
    try {
        const { data, error } = await supabase
            .from('invitations')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }

        console.log('Table "invitations" is NOW visible to the API!');
        process.exit(0);
    } catch (err) {
        console.error('Unexpected error:', err.message);
        process.exit(1);
    }
}

verify();
