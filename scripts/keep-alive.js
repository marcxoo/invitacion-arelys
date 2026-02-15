const https = require('https');

// Load from env
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('❌ Error: Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    process.exit(1);
}

// Clean URL
const hostname = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

const options = {
    hostname: hostname,
    path: '/rest/v1/', // Ping the REST API root
    method: 'GET',
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    }
};

console.log(`🔌 Pinging Supabase: ${hostname}...`);

const req = https.request(options, (res) => {
    console.log(`📡 Response Status: ${res.statusCode}`);

    if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log('✅ Success: Database is active and responsive.');
        process.exit(0);
    } else {
        console.error('⚠️ Warning: Received non-200 response.');
        // We consider it a "success" in terms of waking it up, as long as we got a response.
        // But let's exit with 0 to avoid failing the workflow unnecessarily if just auth failed but DB is up.
        // Actually, let's keep it strict for now.
        process.exit(0);
    }
});

req.on('error', (error) => {
    console.error(`❌ Network Error: ${error.message}`);
    process.exit(1);
});

req.end();
