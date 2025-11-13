#!/bin/bash

# Function to calculate relative path
calc_rel_path() {
    local from_dir="$1"
    local to_file="$2"
    
    # Count directory depth
    local depth=$(echo "$from_dir" | grep -o "/" | wc -l)
    
    # Build relative path
    local rel=""
    for ((i=0; i<depth; i++)); do
        rel="../$rel"
    done
    
    echo "${rel}${to_file}"
}

# Fix imports in all TypeScript/TSX files
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
    -e "s|from '@/components/ui/Button'|from '../components/ui/Button'|g" \
    -e "s|from '@/components/ui/Card'|from '../components/ui/Card'|g" \
    -e "s|from '@/components/ui/Input'|from '../components/ui/Input'|g" \
    -e "s|from '@/components/ui/Badge'|from '../components/ui/Badge'|g" \
    -e "s|from '@/components/ui/Spinner'|from '../components/ui/Spinner'|g" \
    -e "s|from '@/components/ui/Modal'|from '../components/ui/Modal'|g" \
    -e "s|from '@/components/ui/Select'|from '../components/ui/Select'|g" \
    -e "s|from '@/components/ui/Stepper'|from '../components/ui/Stepper'|g" \
    -e "s|from '@/components/Layout/|from '../components/Layout/|g" \
    -e "s|from '@/components/DataTable/|from '../components/DataTable/|g" \
    -e "s|from '@/components/auth/|from '../components/auth/|g" \
    -e "s|from '@/pages/|from '../pages/|g" \
    -e "s|from '@/hooks/|from '../hooks/|g" \
    -e "s|from '@/store/|from '../store/|g" \
    -e "s|from '@/contexts/|from '../contexts/|g" \
    -e "s|from '@/types/|from '../types/|g" \
    -e "s|from '@/utils/|from '../utils/|g" \
    -e "s|from '@/lib/|from '../lib/|g" \
    -e "s|from '@/api/|from '../api/|g" \
    {} +

echo "✅ Import paths converted"
