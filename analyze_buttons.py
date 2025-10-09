#!/usr/bin/env python3
"""
Script to analyze all buttons in the frontend codebase
and identify green/success buttons for testing
"""
import os
import re
import json
from pathlib import Path

def analyze_buttons():
    """Find and categorize all buttons in the frontend"""
    frontend_src = Path("/workspace/project/TRADEAI/frontend/src")
    buttons_data = {
        "green_buttons": [],
        "all_buttons": [],
        "by_component": {}
    }
    
    # Patterns to identify green/success buttons
    green_patterns = [
        r'color\s*=\s*["\']success["\']',
        r'color\s*=\s*["\']primary["\']',  # Primary is often green in Material-UI
        r'variant\s*=\s*["\']contained["\']\s*color\s*=\s*["\']primary["\']',
        r'sx\s*=\s*\{[^}]*green[^}]*\}',
        r'backgroundColor:\s*["\']#[0-9a-fA-F]*[3-9a-fA-F][0-9a-fA-F]{2}["\']\}',  # Greenish colors
        r'bg-green',
        r'btn-success',
    ]
    
    for js_file in frontend_src.rglob("*.js"):
        if "node_modules" in str(js_file) or "__tests__" in str(js_file):
            continue
            
        try:
            content = js_file.read_text()
            
            # Find all Button components
            button_pattern = r'<(Button|IconButton|Fab)[^>]*>([^<]*)</\1>'
            buttons = re.finditer(button_pattern, content, re.DOTALL)
            
            component_buttons = []
            for match in buttons:
                button_content = match.group(0)
                line_num = content[:match.start()].count('\n') + 1
                
                button_info = {
                    "file": str(js_file.relative_to("/workspace/project/TRADEAI")),
                    "line": line_num,
                    "type": match.group(1),
                    "content": button_content[:200],  # Truncate long content
                    "text": match.group(2).strip()[:50],
                    "is_green": False
                }
                
                # Check if it's a green/success button
                for pattern in green_patterns:
                    if re.search(pattern, button_content, re.IGNORECASE):
                        button_info["is_green"] = True
                        break
                
                component_buttons.append(button_info)
                buttons_data["all_buttons"].append(button_info)
                
                if button_info["is_green"]:
                    buttons_data["green_buttons"].append(button_info)
            
            if component_buttons:
                buttons_data["by_component"][str(js_file.relative_to(frontend_src))] = component_buttons
                
        except Exception as e:
            print(f"Error processing {js_file}: {e}")
    
    return buttons_data

def generate_report(buttons_data):
    """Generate a detailed report of all buttons"""
    report = []
    report.append("=" * 80)
    report.append("BUTTON ANALYSIS REPORT")
    report.append("=" * 80)
    report.append(f"\nTotal Buttons Found: {len(buttons_data['all_buttons'])}")
    report.append(f"Green/Success Buttons: {len(buttons_data['green_buttons'])}")
    report.append(f"Components with Buttons: {len(buttons_data['by_component'])}")
    
    report.append("\n" + "=" * 80)
    report.append("GREEN/SUCCESS BUTTONS (Priority for Testing)")
    report.append("=" * 80)
    
    for i, button in enumerate(buttons_data['green_buttons'], 1):
        report.append(f"\n{i}. {button['file']}:{button['line']}")
        report.append(f"   Type: {button['type']}")
        report.append(f"   Text: {button['text']}")
        report.append(f"   Preview: {button['content'][:100]}...")
    
    report.append("\n" + "=" * 80)
    report.append("ALL BUTTONS BY COMPONENT")
    report.append("=" * 80)
    
    for component, buttons in sorted(buttons_data['by_component'].items()):
        report.append(f"\n{component} ({len(buttons)} buttons)")
        for button in buttons:
            status = "🟢" if button['is_green'] else "⚪"
            report.append(f"  {status} Line {button['line']}: {button['type']} - {button['text']}")
    
    return "\n".join(report)

if __name__ == "__main__":
    print("Analyzing buttons in the codebase...")
    buttons_data = analyze_buttons()
    
    # Save JSON data
    output_json = "/workspace/project/TRADEAI/button_analysis.json"
    with open(output_json, 'w') as f:
        json.dump(buttons_data, f, indent=2)
    
    # Generate and save report
    report = generate_report(buttons_data)
    output_report = "/workspace/project/TRADEAI/button_analysis_report.txt"
    with open(output_report, 'w') as f:
        f.write(report)
    
    print(f"\nAnalysis complete!")
    print(f"JSON data saved to: {output_json}")
    print(f"Report saved to: {output_report}")
    print("\n" + "=" * 80)
    print(report)
