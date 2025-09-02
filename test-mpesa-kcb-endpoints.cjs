// Simple M-Pesa KCB Endpoint Test Script

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    console.log('🧪 Testing M-Pesa KCB Endpoints');
    console.log('===============================\n');
    
    const tests = [
        {
            name: 'Callback Endpoint (Public)',
            method: 'POST',
            url: `${API_BASE_URL}/mpesa-kcb/callback`,
            data: { test: 'connectivity' }
        },
        {
            name: 'History Endpoint (Protected)',
            method: 'GET',
            url: `${API_BASE_URL}/mpesa-kcb/history`
        },
        {
            name: 'Statistics Endpoint (Protected)',
            method: 'GET',
            url: `${API_BASE_URL}/mpesa-kcb/statistics`
        }
    ];

    let passed = 0;
    let total = tests.length;

    for (const test of tests) {
        try {
            console.log(`Testing ${test.name}...`);
            
            let response;
            if (test.method === 'POST') {
                response = await axios.post(test.url, test.data);
            } else {
                response = await axios.get(test.url);
            }

            if (response.status === 200) {
                console.log(`✅ ${test.name}: SUCCESS`);
                console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...\n`);
                passed++;
            }
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 401 && test.name.includes('Protected')) {
                    console.log(`✅ ${test.name}: SUCCESS (Auth required as expected)`);
                    passed++;
                } else if (status === 200) {
                    console.log(`✅ ${test.name}: SUCCESS`);
                    passed++;
                } else {
                    console.log(`❌ ${test.name}: FAILED (HTTP ${status})`);
                }
            } else {
                console.log(`❌ ${test.name}: FAILED (${error.message})`);
            }
            console.log('');
        }
    }

    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${passed}/${total}`);
    console.log(`📈 Success Rate: ${(passed/total*100).toFixed(1)}%`);
    
    if (passed === total) {
        console.log('\n🎉 All M-Pesa KCB endpoints are working correctly!');
    } else {
        console.log('\n⚠️  Some endpoints need attention');
    }
}

testEndpoints().catch(console.error);
