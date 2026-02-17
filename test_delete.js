const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fonbczonxolkusygojpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbmJjem9ueG9sa3VzeWdvanB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTU2MjIsImV4cCI6MjA4NjY5MTYyMn0.bbRNGk_1JP0_xASk5ZbeMxPTspVjFLM5UpSk_WuGPLU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDelete() {
    console.log('Testing delete...');

    // 1. Insert
    const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert([{ family_name: 'Delete Test', is_public: true }])
        .select()
        .single();

    if (insertError) {
        console.error('Insert failed:', insertError);
        return;
    }
    const id = insertData.id;
    console.log('Inserted:', id);

    // 2. Delete
    // Note: The previous test's cleanup step failed?
    // Let's explicitly check result
    const { data: deleteData, error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id)
        .select();

    if (deleteError) {
        console.error('Delete failed:', deleteError);
    } else if (!deleteData || deleteData.length === 0) {
        console.error('Delete returned no data! (Likely RLS blocking delete)');
    } else {
        console.log('Delete success:', deleteData);
    }
}

testDelete();
