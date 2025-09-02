#!/usr/bin/env python3

# Read the file
with open('backend/src/controllers/payment-gateway.controller.ts', 'r') as f:
    content = f.read()

# Split content at the problematic line
lines = content.split('\n')

# Find the class end (line 759, which is index 758)
class_end_index = -1
export_start_index = -1
method_start_index = -1

for i, line in enumerate(lines):
    if line.strip() == '}' and i > 700:  # Look for class end around line 759
        class_end_index = i
        break

for i, line in enumerate(lines):
    if 'const paymentGatewayController = new PaymentGatewayController()' in line:
        export_start_index = i
        break

for i, line in enumerate(lines):
    if 'async processCashPayment' in line:
        method_start_index = i
        break

print(f"Class ends at line: {class_end_index + 1}")
print(f"Export starts at line: {export_start_index + 1}")  
print(f"Method starts at line: {method_start_index + 1}")

# Extract the method (from method_start_index to end of file, minus the last closing brace)
method_lines = []
for i in range(method_start_index, len(lines)):
    line = lines[i]
    if line.strip() == '}' and i == len(lines) - 1:
        # This is the final closing brace that belongs to the method
        method_lines.append('  }')  # Add proper indentation
        break
    else:
        # Add proper indentation for method content
        if line.startswith('  '):
            method_lines.append(line)
        else:
            method_lines.append('  ' + line)

# Reconstruct the file
new_lines = []

# Add lines up to class end
new_lines.extend(lines[:class_end_index])

# Add the method with proper indentation inside the class
new_lines.extend(method_lines)

# Add class closing brace
new_lines.append('}')

# Add lines from export start to method start (validation middleware and exports)
for i in range(export_start_index, method_start_index):
    new_lines.append(lines[i])

# Write the fixed file
with open('backend/src/controllers/payment-gateway.controller.ts', 'w') as f:
    f.write('\n'.join(new_lines) + '\n')

print("Fixed the payment-gateway.controller.ts file!")
