const fs = require('fs');
const path = require('path');

// Fields to check for duplicate indexes
const fieldsToCheck = ['slug', 'email', 'parentTenantId', 'customerId', 'parentBranchId'];

// Function to find indexes in file content
function findIndexes(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const results = {
    file: fileName,
    fieldDefinitions: {},
    indexDefinitions: []
  };

  // Find field definitions with index/unique properties
  fieldsToCheck.forEach(field => {
    // Check for field definition with index or unique
    const fieldRegex = new RegExp(`${field}:\\s*{[^}]*?(unique|index):\\s*true`, 'gs');
    const fieldMatch = content.match(fieldRegex);
    if (fieldMatch) {
      results.fieldDefinitions[field] = fieldMatch[0];
    }
  });

  // Find explicit .index() calls
  const indexRegex = /\.index\(([^)]+)\)/g;
  let match;
  while ((match = indexRegex.exec(content)) !== null) {
    const indexDef = match[1];
    // Check if any of our fields are in this index
    fieldsToCheck.forEach(field => {
      if (indexDef.includes(field)) {
        results.indexDefinitions.push({
          field: field,
          definition: match[0]
        });
      }
    });
  }

  return results;
}

// Get all TypeScript model files
const modelsDir = path.join(__dirname, 'src', 'models');
const files = fs.readdirSync(modelsDir).filter(f => f.endsWith('.ts'));

console.log('=== DUPLICATE INDEX ANALYSIS ===\n');

const duplicateIssues = [];

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const results = findIndexes(filePath);
  
  // Check for duplicates
  Object.keys(results.fieldDefinitions).forEach(field => {
    const hasIndexDef = results.indexDefinitions.some(idx => idx.field === field);
    if (hasIndexDef) {
      duplicateIssues.push({
        file: results.file,
        field: field,
        issue: `Field '${field}' has both inline index/unique property AND explicit .index() call`,
        fieldDef: results.fieldDefinitions[field],
        indexDefs: results.indexDefinitions.filter(idx => idx.field === field)
      });
    }
  });
});

// Report findings
if (duplicateIssues.length > 0) {
  console.log('🔴 DUPLICATE INDEX ISSUES FOUND:\n');
  
  duplicateIssues.forEach((issue, index) => {
    console.log(`${index + 1}. File: ${issue.file}`);
    console.log(`   Field: ${issue.field}`);
    console.log(`   Issue: ${issue.issue}`);
    console.log(`   Field Definition: ${issue.fieldDef.replace(/\s+/g, ' ').substring(0, 100)}...`);
    issue.indexDefs.forEach(idx => {
      console.log(`   Index Call: ${idx.definition}`);
    });
    console.log('');
  });

  // Summary
  console.log('\n=== SUMMARY ===');
  const filesSummary = {};
  duplicateIssues.forEach(issue => {
    if (!filesSummary[issue.file]) {
      filesSummary[issue.file] = [];
    }
    filesSummary[issue.file].push(issue.field);
  });

  console.log('\nAffected Files:');
  Object.entries(filesSummary).forEach(([file, fields]) => {
    console.log(`  - ${file}: ${fields.join(', ')}`);
  });

  console.log('\n=== RECOMMENDATIONS ===');
  console.log('For each duplicate:');
  console.log('  1. If field has "unique: true" - remove the .index() call (unique creates an index automatically)');
  console.log('  2. If field has "index: true" - either remove it OR remove the .index() call (not both)');
  console.log('  3. For compound indexes - keep the .index() call, remove "index: true" from field definition');
} else {
  console.log('✅ No duplicate index issues found!');
}

// Additional check for compound indexes that might be duplicated
console.log('\n=== COMPOUND INDEX CHECK ===\n');
const compoundIndexes = {};

files.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  const indexRegex = /\.index\(\{([^}]+)\}/g;
  let match;
  while ((match = indexRegex.exec(content)) !== null) {
    const indexContent = match[1];
    if (indexContent.includes(',')) {  // It's a compound index
      const key = indexContent.replace(/\s/g, '');
      if (!compoundIndexes[key]) {
        compoundIndexes[key] = [];
      }
      compoundIndexes[key].push({
        file: file,
        line: content.substring(0, match.index).split('\n').length,
        definition: match[0]
      });
    }
  }
});

// Check for duplicate compound indexes
const duplicateCompounds = [];
Object.entries(compoundIndexes).forEach(([key, locations]) => {
  if (locations.length > 1) {
    duplicateCompounds.push({
      index: key,
      locations: locations
    });
  }
});

if (duplicateCompounds.length > 0) {
  console.log('🔴 DUPLICATE COMPOUND INDEXES FOUND:\n');
  duplicateCompounds.forEach(dup => {
    console.log(`Duplicate Index: {${dup.index}}`);
    dup.locations.forEach(loc => {
      console.log(`  - ${loc.file}:${loc.line} - ${loc.definition}`);
    });
    console.log('');
  });
} else {
  console.log('✅ No duplicate compound indexes found!');
}