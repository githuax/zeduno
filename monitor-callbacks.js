#!/usr/bin/env node

// Callback monitoring script for Zed Business M-Pesa notifications
const http = require('http');
const fs = require('fs');
const path = require('path');

const CALLBACK_ENDPOINTS = [
    '/api/payments/mpesa-callback',
    '/api/mpesa-kcb/callback'
];

const LOG_FILE = 'callback-monitor.log';

function logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    
    console.log(logEntry.trim());
    fs.appendFileSync(LOG_FILE, logEntry);
}

// Monitor callback endpoints by listening to real-time logs
function monitorCallbacks() {
    logMessage('Starting callback monitor...');
    logMessage(`Monitoring endpoints: ${CALLBACK_ENDPOINTS.join(', ')}`);
    
    // Watch the backend log file for callback activity
    if (fs.existsSync('./backend/backend.log')) {
        const watcher = fs.watchFile('./backend/backend.log', (curr, prev) => {
            if (curr.mtime > prev.mtime) {
                // Log file was modified, check for new callback entries
                try {
                    const content = fs.readFileSync('./backend/backend.log', 'utf8');
                    const lines = content.split('\n').slice(-10); // Last 10 lines
                    
                    lines.forEach(line => {
                        if (line.includes('callback') || line.includes('M-Pesa') || line.includes('Zed')) {
                            logMessage(`LOG: ${line}`);
                        }
                    });
                } catch (err) {
                    logMessage(`Error reading log file: ${err.message}`);
                }
            }
        });
        
        logMessage('Watching backend log file for callback activity...');
    }
    
    logMessage('Monitor started. Press Ctrl+C to stop.');
    logMessage('Waiting for Zed Business callback notifications...');
}

// Test both callback endpoints to ensure they are accessible
async function testCallbackEndpoints() {
    logMessage('Testing callback endpoint accessibility...');
    
    for (const endpoint of CALLBACK_ENDPOINTS) {
        const url = `http://192.168.2.43:5000${endpoint}`;
        
        try {
            const postData = JSON.stringify({
                test: true,
                timestamp: new Date().toISOString(),
                monitor: 'callback-test'
            });
            
            const options = {
                hostname: '192.168.2.43',
                port: 5000,
                path: endpoint,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    logMessage(`✅ ${endpoint} - Status: ${res.statusCode}, Response: ${data}`);
                });
            });
            
            req.on('error', (err) => {
                logMessage(`❌ ${endpoint} - Error: ${err.message}`);
            });
            
            req.on('timeout', () => {
                logMessage(`⏱️ ${endpoint} - Request timeout`);
                req.destroy();
            });
            
            req.write(postData);
            req.end();
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (err) {
            logMessage(`❌ ${endpoint} - Test failed: ${err.message}`);
        }
    }
}

// Check current configuration
function checkConfiguration() {
    logMessage('=== Callback Configuration Check ===');
    logMessage('Expected Zed Business callback URLs:');
    logMessage('• http://192.168.2.43:5000/api/payments/mpesa-callback');
    logMessage('• http://192.168.2.43:5000/api/mpesa-kcb/callback');
    logMessage('');
    logMessage('Make sure one of these URLs is configured in your Zed Business merchant dashboard.');
    logMessage('');
}

// Main execution
async function main() {
    checkConfiguration();
    await testCallbackEndpoints();
    logMessage('');
    monitorCallbacks();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logMessage('Callback monitor stopped by user.');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logMessage('Callback monitor terminated.');
    process.exit(0);
});

main().catch(err => {
    logMessage(`Monitor error: ${err.message}`);
    process.exit(1);
});
