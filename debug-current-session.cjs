#!/usr/bin/env node

// Debug current authentication session
console.log('=== Current Session Debug ===\n');

console.log('To debug this issue, open your browser and run the following in the console:');
console.log('');
console.log('// Check all localStorage data');
console.log('Object.keys(localStorage).forEach(key => {');
console.log('  console.log(key + ":", localStorage.getItem(key));');
console.log('});');
console.log('');
console.log('// Check specific authentication data');
console.log('const token = localStorage.getItem("token");');
console.log('const user = localStorage.getItem("user");');
console.log('const superadminToken = localStorage.getItem("superadmin_token");');
console.log('const superadminUser = localStorage.getItem("superadmin_user");');
console.log('const currentTenantId = localStorage.getItem("currentTenantId");');
console.log('');
console.log('console.log("Regular token:", token);');
console.log('console.log("Regular user:", user);');
console.log('console.log("Superadmin token:", superadminToken);');
console.log('console.log("Superadmin user:", superadminUser);');
console.log('console.log("Current tenant ID:", currentTenantId);');
console.log('');

// Show what we know from the codebase analysis
console.log('=== Analysis from Code Review ===');
console.log('');
console.log('ISSUE IDENTIFIED:');
console.log('The Header component displays tenant name from tenantContext?.tenant?.name');
console.log('');
console.log('POTENTIAL CAUSES:');
console.log('1. User logged in with kimathichris15@gmail.com but localStorage has cached data from previous user');
console.log('2. Tenant context is not properly switching when user changes');
console.log('3. Hard-coded tenant data in mock implementation (useTenant.ts has mock data)');
console.log('4. Authentication state mismatch - user token vs tenant data');
console.log('5. Backend database has wrong tenant mapping for user');
console.log('');
console.log('MOCK DATA FOUND IN CODE:');
console.log('- tenant_001: "Joe\'s Pizza Palace"');
console.log('- tenant_002: "Bella Vista Restaurants"');
console.log('- But you see "Dama\'s Restaurant" - this suggests REAL data from backend');
console.log('');
console.log('KEY INSIGHT:');
console.log('"Dama\'s Restaurant" is NOT in the mock data, so this is coming from the backend!');
console.log('This means the user kimathichris15@gmail.com is correctly authenticated,');
console.log('but their tenant in the database is mapped to dama@mail.com\'s restaurant.');
console.log('');
console.log('IMMEDIATE SOLUTIONS:');
console.log('1. Clear browser cache and localStorage: localStorage.clear()');
console.log('2. Check backend database for user-tenant mapping');
console.log('3. Verify kimathichris15@gmail.com tenant assignment in database');
console.log('');
console.log('DATABASE QUERIES TO CHECK:');
console.log('- Find user: db.users.findOne({email: "kimathichris15@gmail.com"})');
console.log('- Check their tenantId field');
console.log('- Find tenant: db.tenants.findOne({_id: <tenantId>})');
console.log('- Verify tenant owner email');
