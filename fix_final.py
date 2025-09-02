#!/usr/bin/env python3

# Read the file
with open('backend/src/controllers/payment-gateway.controller.ts', 'r') as f:
    lines = f.readlines()

# Remove trailing whitespace and find problematic content
cleaned_lines = []
inside_class = False
class_ended = False

for i, line in enumerate(lines):
    line_stripped = line.rstrip()
    
    # Track class boundaries
    if 'export class PaymentGatewayController {' in line:
        inside_class = True
        cleaned_lines.append(line)
    elif line_stripped == '}' and inside_class and not class_ended:
        # This is the class closing brace
        cleaned_lines.append(line)
        class_ended = True
        inside_class = False
    elif class_ended and ('const paymentGatewayController' in line or 'export default' in line):
        # These are the export lines after class
        cleaned_lines.append(line)
    elif class_ended and ('// Process cash payment' in line or line_stripped == ''):
        # Skip leftover comments and empty lines after exports
        continue
    else:
        cleaned_lines.append(line)

# Write the cleaned file
with open('backend/src/controllers/payment-gateway.controller.ts', 'w') as f:
    f.writelines(cleaned_lines)

print("Cleaned up the controller file!")
