import os
import re
from pathlib import Path

def get_relative_path(from_file, to_module):
    """Calculate relative import path"""
    from_dir = Path(from_file).parent
    
    # Map @/ aliases to actual paths
    module_map = {
        '@/components/': 'src/components/',
        '@/pages/': 'src/pages/',
        '@/hooks/': 'src/hooks/',
        '@/store/': 'src/store/',
        '@/contexts/': 'src/contexts/',
        '@/types/': 'src/types/',
        '@/utils/': 'src/utils/',
        '@/lib/': 'src/lib/',
        '@/api/': 'src/api/',
    }
    
    # Find which alias matches
    for alias, actual_path in module_map.items():
        if to_module.startswith(alias):
            # Calculate relative path
            target = to_module.replace(alias, actual_path)
            target_path = Path(target)
            
            try:
                rel_path = os.path.relpath(target_path, from_dir)
                # Ensure it starts with ./
                if not rel_path.startswith('.'):
                    rel_path = './' + rel_path
                # Remove .tsx or .ts extension if present in import
                rel_path = rel_path.replace('.tsx', '').replace('.ts', '')
                return rel_path
            except:
                return to_module
    
    return to_module

def fix_file(filepath):
    """Fix imports in a single file"""
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Find all imports with @/
    import_pattern = r"from\s+['\"](@/[^'\"]+)['\"]"
    
    def replace_import(match):
        module = match.group(1)
        rel_path = get_relative_path(filepath, module)
        return f"from '{rel_path}'"
    
    new_content = re.sub(import_pattern, replace_import, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        return True
    return False

# Process all TypeScript files
src_dir = Path('src')
fixed_count = 0

for ts_file in src_dir.rglob('*.ts*'):
    if fix_file(ts_file):
        fixed_count += 1
        print(f"Fixed: {ts_file}")

print(f"\n✅ Fixed {fixed_count} files")
