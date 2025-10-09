#!/usr/bin/env python3
"""
TRADEAI Complete System Audit
Analyzes entire codebase for refactoring and testing
"""

import os
import json
import re
from pathlib import Path
from collections import defaultdict

def analyze_system():
    """Comprehensive system analysis"""
    
    base_dir = Path('.')
    
    results = {
        'backend': {
            'routes': [],
            'models': [],
            'services': [],
            'middleware': [],
            'controllers': []
        },
        'frontend': {
            'pages': [],
            'components': [],
            'contexts': [],
            'hooks': [],
            'services': []
        },
        'database': {
            'schemas': [],
            'migrations': []
        },
        'tests': {
            'backend_tests': [],
            'frontend_tests': [],
            'e2e_tests': []
        },
        'statistics': {
            'total_files': 0,
            'backend_files': 0,
            'frontend_files': 0,
            'test_files': 0,
            'lines_of_code': 0
        }
    }
    
    # Analyze backend
    backend_dir = base_dir / 'backend' / 'src'
    if backend_dir.exists():
        for file_path in backend_dir.rglob('*.js'):
            rel_path = file_path.relative_to(base_dir)
            results['statistics']['total_files'] += 1
            results['statistics']['backend_files'] += 1
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                results['statistics']['lines_of_code'] += len(content.split('\n'))
            
            # Categorize files
            if 'routes' in str(file_path) or 'route' in file_path.name.lower():
                results['backend']['routes'].append(str(rel_path))
            elif 'model' in file_path.name.lower():
                results['backend']['models'].append(str(rel_path))
            elif 'service' in file_path.name.lower():
                results['backend']['services'].append(str(rel_path))
            elif 'middleware' in str(file_path):
                results['backend']['middleware'].append(str(rel_path))
            elif 'controller' in file_path.name.lower():
                results['backend']['controllers'].append(str(rel_path))
    
    # Analyze frontend
    frontend_dir = base_dir / 'frontend' / 'src'
    if frontend_dir.exists():
        for file_path in frontend_dir.rglob('*.js'):
            rel_path = file_path.relative_to(base_dir)
            results['statistics']['total_files'] += 1
            results['statistics']['frontend_files'] += 1
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                results['statistics']['lines_of_code'] += len(content.split('\n'))
            
            # Categorize files
            if 'pages' in str(file_path) or 'Pages' in str(file_path):
                results['frontend']['pages'].append(str(rel_path))
            elif 'components' in str(file_path) or 'Components' in str(file_path):
                results['frontend']['components'].append(str(rel_path))
            elif 'context' in file_path.name.lower() or 'Context' in file_path.name:
                results['frontend']['contexts'].append(str(rel_path))
            elif file_path.name.startswith('use') and file_path.suffix == '.js':
                results['frontend']['hooks'].append(str(rel_path))
            elif 'service' in file_path.name.lower() or 'api' in file_path.name.lower():
                results['frontend']['services'].append(str(rel_path))
    
    # Analyze JSX files
    if frontend_dir.exists():
        for file_path in frontend_dir.rglob('*.jsx'):
            rel_path = file_path.relative_to(base_dir)
            results['statistics']['total_files'] += 1
            results['statistics']['frontend_files'] += 1
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                results['statistics']['lines_of_code'] += len(content.split('\n'))
            
            if 'pages' in str(file_path) or 'Pages' in str(file_path):
                results['frontend']['pages'].append(str(rel_path))
            else:
                results['frontend']['components'].append(str(rel_path))
    
    # Analyze tests
    for test_dir in ['backend', 'frontend', 'tests']:
        test_path = base_dir / test_dir
        if test_path.exists():
            for file_path in test_path.rglob('*.test.js'):
                rel_path = file_path.relative_to(base_dir)
                results['statistics']['test_files'] += 1
                
                if 'backend' in str(file_path):
                    results['tests']['backend_tests'].append(str(rel_path))
                elif 'frontend' in str(file_path):
                    results['tests']['frontend_tests'].append(str(rel_path))
            
            for file_path in test_path.rglob('*.spec.js'):
                rel_path = file_path.relative_to(base_dir)
                results['statistics']['test_files'] += 1
                results['tests']['e2e_tests'].append(str(rel_path))
    
    # Calculate coverage metrics
    results['statistics']['test_coverage'] = {
        'backend_routes_covered': len(results['tests']['backend_tests']),
        'backend_routes_total': len(results['backend']['routes']),
        'frontend_pages_covered': len([t for t in results['tests']['frontend_tests'] if 'page' in t.lower()]),
        'frontend_pages_total': len(results['frontend']['pages']),
        'e2e_tests_count': len(results['tests']['e2e_tests'])
    }
    
    return results

def generate_report(results):
    """Generate comprehensive audit report"""
    
    report = []
    report.append("=" * 80)
    report.append("TRADEAI COMPLETE SYSTEM AUDIT")
    report.append("=" * 80)
    report.append("")
    
    # Statistics
    report.append("📊 SYSTEM STATISTICS")
    report.append("-" * 80)
    stats = results['statistics']
    report.append(f"Total Files:          {stats['total_files']}")
    report.append(f"Backend Files:        {stats['backend_files']}")
    report.append(f"Frontend Files:       {stats['frontend_files']}")
    report.append(f"Test Files:           {stats['test_files']}")
    report.append(f"Total Lines of Code:  {stats['lines_of_code']:,}")
    report.append("")
    
    # Backend
    report.append("🔧 BACKEND COMPONENTS")
    report.append("-" * 80)
    report.append(f"Routes:         {len(results['backend']['routes'])}")
    report.append(f"Models:         {len(results['backend']['models'])}")
    report.append(f"Services:       {len(results['backend']['services'])}")
    report.append(f"Middleware:     {len(results['backend']['middleware'])}")
    report.append(f"Controllers:    {len(results['backend']['controllers'])}")
    report.append("")
    
    # Frontend
    report.append("🎨 FRONTEND COMPONENTS")
    report.append("-" * 80)
    report.append(f"Pages:          {len(results['frontend']['pages'])}")
    report.append(f"Components:     {len(results['frontend']['components'])}")
    report.append(f"Contexts:       {len(results['frontend']['contexts'])}")
    report.append(f"Custom Hooks:   {len(results['frontend']['hooks'])}")
    report.append(f"Services:       {len(results['frontend']['services'])}")
    report.append("")
    
    # Testing
    report.append("🧪 TESTING COVERAGE")
    report.append("-" * 80)
    cov = stats['test_coverage']
    report.append(f"Backend Tests:       {cov['backend_routes_covered']}")
    report.append(f"Frontend Tests:      {len(results['tests']['frontend_tests'])}")
    report.append(f"E2E Tests:           {cov['e2e_tests_count']}")
    report.append("")
    
    # Detailed breakdowns
    if results['backend']['routes']:
        report.append("📍 BACKEND ROUTES")
        report.append("-" * 80)
        for route in sorted(results['backend']['routes'])[:20]:
            report.append(f"  • {route}")
        if len(results['backend']['routes']) > 20:
            report.append(f"  ... and {len(results['backend']['routes']) - 20} more")
        report.append("")
    
    if results['backend']['models']:
        report.append("📦 DATABASE MODELS")
        report.append("-" * 80)
        for model in sorted(results['backend']['models']):
            report.append(f"  • {model}")
        report.append("")
    
    if results['frontend']['pages']:
        report.append("📄 FRONTEND PAGES")
        report.append("-" * 80)
        for page in sorted(results['frontend']['pages'])[:30]:
            report.append(f"  • {page}")
        if len(results['frontend']['pages']) > 30:
            report.append(f"  ... and {len(results['frontend']['pages']) - 30} more")
        report.append("")
    
    return "\n".join(report)

if __name__ == '__main__':
    print("Starting comprehensive system audit...")
    results = analyze_system()
    
    # Save JSON
    with open('system-audit.json', 'w') as f:
        json.dump(results, f, indent=2)
    print("✓ Saved system-audit.json")
    
    # Save report
    report = generate_report(results)
    with open('system-audit-report.txt', 'w') as f:
        f.write(report)
    print("✓ Saved system-audit-report.txt")
    
    print("\n" + report)
