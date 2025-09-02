const fs = require('fs');

// Read the Analytics.tsx file
const filePath = 'src/pages/superadmin/Analytics.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add the import for currency utility at the top
if (!content.includes('import { formatCurrency }')) {
  // Find the import section and add currency import
  content = content.replace(
    /(import.*from ['"][^'"]+['"];?\s*)+/,
    `$&import { formatCurrency } from '../../utils/currency';\n`
  );
}

// Replace the dollar sign display with KES currency formatting
content = content.replace(
  /\$\{systemStats\.totalRevenue\.toLocaleString\(\)\}/g,
  '{formatCurrency(systemStats.totalRevenue, "KES")}'
);

// Also replace the DollarSign icon import and usage
content = content.replace(
  /import \{[^}]*DollarSign[^}]*\} from ['"]lucide-react['"];?/g,
  (match) => match.replace('DollarSign', 'Banknote')
);

content = content.replace(
  /<DollarSign className="h-4 w-4 text-muted-foreground" \/>/g,
  '<Banknote className="h-4 w-4 text-muted-foreground" />'
);

// Write the updated file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Updated Analytics.tsx to use KES currency format');
console.log('📊 Revenue now displays as "KSh" instead of "$"');
console.log('💱 Changed DollarSign icon to Banknote icon');
