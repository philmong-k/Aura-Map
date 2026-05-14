#!/bin/bash
echo "🔍 Searching for the source code with 'Note+Ledger'..."
find /home/philmong -type f \( -name "*.jsx" -o -name "*.tsx" -o -name "*.js" \) -not -path "*/node_modules/*" -print0 | xargs -0 grep -l "Note+Ledger"
