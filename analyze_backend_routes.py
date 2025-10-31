#!/usr/bin/env python3
"""
Analyze all backend route files and generate comprehensive API documentation
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List

ROUTES_DIR = "backend-api-documentation/routes"
OUTPUT_DIR = "backend-api-analysis"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def extract_routes_from_file(filepath: str) -> List[Dict]:
    """Extract all routes from a route file"""
    routes = []
    
    with open(filepath, 'r') as f:
        content = f.content()
    
    # Extract router method calls (GET, POST, PUT, DELETE, PATCH)
    patterns = [
        r"router\.(get|post|put|delete|patch)\(['\"]([^'\"]+)['\"]",  # router.get('/path'
        r"router\.(use)\(['\"]([^'\"]+)['\"]",  # router.use('/path'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        for method, path in matches:
            routes.append({
                "method": method.upper(),
                "path": path,
                "file": os.path.basename(filepath)
            })
    
    return routes

def main():
    all_routes = {}
    
    # Process all route files
    for filename in os.listdir(ROUTES_DIR):
        if filename.endswith('.js'):
            filepath = os.path.join(ROUTES_DIR, filename)
            module_name = filename.replace('.js', '')
            
            print(f"Analyzing {filename}...")
            
            routes = extract_routes_from_file(filepath)
            if routes:
                all_routes[module_name] = routes
    
    # Generate markdown documentation
    doc = """# TRADEAI Backend API Documentation
## Complete API Endpoint Reference

**Generated**: Auto-generated from backend source code  
**Backend URL**: https://tradeai.gonxt.tech/api

---

## API Modules

"""
    
    for module, routes in sorted(all_routes.items()):
        doc += f"### {module.title()} Module\n\n"
        doc += f"**Route File**: `{module}.js`  \n"
        doc += f"**Endpoints**: {len(routes)}\n\n"
        
        if routes:
            doc += "| Method | Path |\n"
            doc += "|--------|------|\n"
            
            for route in sorted(routes, key=lambda x: (x['method'], x['path'])):
                doc += f"| {route['method']} | {route['path']} |\n"
        
        doc += "\n"
    
    # Save documentation
    output_file = os.path.join(OUTPUT_DIR, "BACKEND_API_REFERENCE.md")
    with open(output_file, 'w') as f:
        f.write(doc)
    
    print(f"\nDocumentation generated: {output_file}")
    print(f"Total modules: {len(all_routes)}")
    print(f"Total routes: {sum(len(r) for r in all_routes.values())}")

if __name__ == "__main__":
    main()
