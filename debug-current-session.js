#!/usr/bin/env node

// Debug current authentication session
console.log('=== Current Session Debug ===\n');

// Check localStorage (simulated for Node.js - this is what browser localStorage should contain)
const fs = require('fs');

// Since this is a Node.js debug script, we'll show what should be checked in the browser
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
console.log('');
console.log('MOCK DATA FOUND:');
console.log('- tenant_001: "Joe\'s Pizza Palace"');
console.log('- tenant_002: "Bella Vista Restaurants"');
console.log('- But you see "Dama\'s Restaurant" which is not in mock data');
console.log('');
console.log('NEXT STEPS:');
console.log('1. Clear localStorage completely: localStorage.clear()');
console.log('2. Login again with kimathichris15@gmail.com');
console.log('3. Check if issue persists');
console.log('4. If issue persists, check backend database for user/tenant mapping');
