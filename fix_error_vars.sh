#!/bin/bash

# Script to fix TypeScript error variable naming issues
# Converts references to 'error' inside catch(_error) blocks to use '_error'

cd "/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project/backend"

# Find all TypeScript files with _error catch blocks
echo "Finding files with _error catch blocks..."
FILES=$(find src -name "*.ts" -type f -exec grep -l "catch.*(_error)" {} \;)

for file in $FILES; do
  echo "Processing: $file"
  
  # Create a temporary file for processing
  temp_file=$(mktemp)
  
  # Process the file line by line to fix error references in catch blocks
  python3 << EOF
import re

with open('$file', 'r') as f:
    content = f.read()

# Pattern to match catch blocks with _error parameter and fix error references within them
# This is a complex pattern that needs to handle multiple lines
def fix_catch_blocks(content):
    lines = content.split('\n')
    result_lines = []
    in_catch_block = False
    brace_count = 0
    
    for line in lines:
        # Check if we're entering a catch block with _error
        if 'catch (_error)' in line:
            in_catch_block = True
            brace_count = 0
            result_lines.append(line)
            continue
            
        if in_catch_block:
            # Count braces to track block scope
            brace_count += line.count('{') - line.count('}')
            
            # Replace 'error' with '_error' in this line, but be careful about word boundaries
            # Don't replace 'error' in strings or when it's part of another word
            fixed_line = re.sub(r'\berror\b(?!\w)', '_error', line)
            result_lines.append(fixed_line)
            
            # If we've closed all braces, we're out of the catch block
            if brace_count <= 0:
                in_catch_block = False
        else:
            result_lines.append(line)
    
    return '\n'.join(result_lines)

fixed_content = fix_catch_blocks(content)

with open('$temp_file', 'w') as f:
    f.write(fixed_content)
EOF

  # Replace the original file with the fixed version
  mv "$temp_file" "$file"
done

echo "Fixed error variable references in catch blocks."