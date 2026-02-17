const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fonbczonxolkusygojpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbmJjem9ueG9sa3VzeWdvanB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTU2MjIsImV4cCI6MjA4NjY5MTYyMn0.bbRNGk_1JP0_xASk5ZbeMxPTspVjFLM5UpSk_WuGPLU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking invitations table schema...');
    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Success! Data:', data);
        if (data.length > 0) {
            console.log('Keys:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, assuming standard columns.');
        }
    }
}

check();
