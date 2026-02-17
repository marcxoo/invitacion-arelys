const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fonbczonxolkusygojpz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvbmJjem9ueG9sa3VzeWdvanB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTU2MjIsImV4cCI6MjA4NjY5MTYyMn0.bbRNGk_1JP0_xASk5ZbeMxPTspVjFLM5UpSk_WuGPLU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    console.log('Testing insert and update...');

    // 1. Insert
    const { data: insertData, error: insertError } = await supabase
        .from('invitations')
        .insert([{ family_name: 'Test Family', is_public: true }])
        .select()
        .single();

    if (insertError) {
        console.error('Insert failed:', insertError);
        return;
    }
    console.log('Insert success:', insertData);
    const id = insertData.id;

    // 2. Update
    console.log(`Updating row ${id}...`);
    const { data: updateData, error: updateError } = await supabase
        .from('invitations')
        .update({ family_name: 'Updated Family' })
        .eq('id', id)
        .select();

    if (updateError) {
        console.error('Update failed with error:', updateError);
    } else if (!updateData || updateData.length === 0) {
        console.error('Update returned no data! (Likely RLS blocking update)');
    } else {
        console.log('Update success:', updateData);
    }

    // 3. Clean up (delete)
    const { error: deleteError } = await supabase
        .from('invitations')
        .delete()
        .eq('id', id);

    if (deleteError) console.log('Cleanup delete failed:', deleteError);
}

testUpdate();
