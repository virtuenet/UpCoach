#!/bin/bash

# Fix React imports in admin-panel

ADMIN_DIR="/Users/ardisetiadharma/CURSOR Repository/UpCoach/upcoach-project/admin-panel"

echo "Fixing React imports in admin-panel..."

# Fix components with missing React hooks
files_with_hooks=$(grep -r "useState\|useEffect\|useCallback\|useMemo\|useRef\|useContext" "$ADMIN_DIR/src" --include="*.tsx" --include="*.ts" -l)

for file in $files_with_hooks; do
  # Check if React is already imported
  if ! grep -q "^import.*React" "$file" && ! grep -q "^import.*{.*useState\|useEffect\|useCallback\|useMemo\|useRef\|useContext" "$file"; then
    echo "Adding React import to: $file"
    # Get all hooks used in the file
    hooks=$(grep -o "use[A-Z][a-zA-Z]*" "$file" | sort -u | grep "^use" | tr '\n' ',' | sed 's/,$//')
    if [ ! -z "$hooks" ]; then
      # Add React import at the beginning
      sed -i '' "1s/^/import React, { ${hooks//,/, } } from 'react';\n/" "$file"
    fi
  fi
done

# Fix missing react-router-dom imports
files_with_router=$(grep -r "useNavigate\|useParams\|useLocation\|Link\|NavLink" "$ADMIN_DIR/src" --include="*.tsx" --include="*.ts" -l)

for file in $files_with_router; do
  if ! grep -q "from 'react-router-dom'" "$file"; then
    echo "Adding react-router-dom import to: $file"
    # Check what needs to be imported
    needs=""
    grep -q "useNavigate" "$file" && needs="${needs}useNavigate, "
    grep -q "useParams" "$file" && needs="${needs}useParams, "
    grep -q "useLocation" "$file" && needs="${needs}useLocation, "
    grep -q "Link[^a-zA-Z]" "$file" && needs="${needs}Link, "
    grep -q "NavLink" "$file" && needs="${needs}NavLink, "
    needs=${needs%, }
    
    if [ ! -z "$needs" ]; then
      sed -i '' "1s/^/import { $needs } from 'react-router-dom';\n/" "$file"
    fi
  fi
done

# Fix missing date-fns imports
files_with_date=$(grep -r "format\|formatDistanceToNow\|parseISO" "$ADMIN_DIR/src" --include="*.tsx" --include="*.ts" -l)

for file in $files_with_date; do
  if ! grep -q "from 'date-fns'" "$file"; then
    echo "Adding date-fns import to: $file"
    needs=""
    grep -q "format[^a-zA-Z]" "$file" && needs="${needs}format, "
    grep -q "formatDistanceToNow" "$file" && needs="${needs}formatDistanceToNow, "
    grep -q "parseISO" "$file" && needs="${needs}parseISO, "
    needs=${needs%, }
    
    if [ ! -z "$needs" ]; then
      sed -i '' "2s/^/import { $needs } from 'date-fns';\n/" "$file"
    fi
  fi
done

# Fix missing MUI icons
files_with_icons=$(grep -r "FolderOpen\|ChevronDown\|Add\|Edit\|Delete\|Search" "$ADMIN_DIR/src/components" --include="*.tsx" -l)

for file in $files_with_icons; do
  icons=""
  grep -q "FolderOpen" "$file" && ! grep -q "import.*FolderOpen" "$file" && icons="${icons}FolderOpen, "
  grep -q "ChevronDown" "$file" && ! grep -q "import.*ChevronDown" "$file" && icons="${icons}ExpandMore as ChevronDown, "
  icons=${icons%, }
  
  if [ ! -z "$icons" ]; then
    echo "Adding MUI icons to: $file"
    sed -i '' "2s/^/import { $icons } from '@mui\/icons-material';\n/" "$file"
  fi
done

echo "Import fixes completed!"