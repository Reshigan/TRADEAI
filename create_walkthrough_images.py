#!/usr/bin/env python3
"""
Script to create placeholder walkthrough images for TRADEAI
"""

import os

# Define the images directory
images_dir = "/workspace/project/TRADEAI/frontend/public/images/walkthrough"

# Ensure directory exists
os.makedirs(images_dir, exist_ok=True)

# Define image templates
image_templates = {
    'dashboard-activity.png': '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="250" fill="#f8fafc"/>
  <text x="200" y="25" text-anchor="middle" fill="#1f2937" font-family="Arial" font-size="16" font-weight="bold">Recent Activity Feed</text>
  
  <rect x="20" y="40" width="360" height="180" fill="#ffffff" rx="8" stroke="#e5e7eb"/>
  
  <!-- Activity items -->
  <circle cx="40" cy="70" r="6" fill="#10b981"/>
  <text x="55" y="75" fill="#374151" font-family="Arial" font-size="12">New promotion "Summer Sale" created</text>
  <text x="55" y="88" fill="#6b7280" font-family="Arial" font-size="10">2 hours ago</text>
  
  <circle cx="40" cy="110" r="6" fill="#3b82f6"/>
  <text x="55" y="115" fill="#374151" font-family="Arial" font-size="12">Budget updated for Q4 2024</text>
  <text x="55" y="128" fill="#6b7280" font-family="Arial" font-size="10">4 hours ago</text>
  
  <circle cx="40" cy="150" r="6" fill="#f59e0b"/>
  <text x="55" y="155" fill="#374151" font-family="Arial" font-size="12">Trade spend approved: $15,000</text>
  <text x="55" y="168" fill="#6b7280" font-family="Arial" font-size="10">1 day ago</text>
  
  <circle cx="40" cy="190" r="6" fill="#e11d48"/>
  <text x="55" y="195" fill="#374151" font-family="Arial" font-size="12">Promotion "Back to School" ended</text>
  <text x="55" y="208" fill="#6b7280" font-family="Arial" font-size="10">2 days ago</text>
</svg>''',

    'dashboard-actions.png': '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="250" fill="#f8fafc"/>
  <text x="200" y="25" text-anchor="middle" fill="#1f2937" font-family="Arial" font-size="16" font-weight="bold">Quick Actions</text>
  
  <!-- Action buttons -->
  <rect x="50" y="50" width="120" height="80" fill="#3b82f6" rx="8"/>
  <text x="110" y="80" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Create</text>
  <text x="110" y="95" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Promotion</text>
  <text x="110" y="115" text-anchor="middle" fill="#bfdbfe" font-family="Arial" font-size="10">Set up new trade promotion</text>
  
  <rect x="230" y="50" width="120" height="80" fill="#10b981" rx="8"/>
  <text x="290" y="80" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Add</text>
  <text x="290" y="95" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Budget</text>
  <text x="290" y="115" text-anchor="middle" fill="#bbf7d0" font-family="Arial" font-size="10">Create budget allocation</text>
  
  <rect x="50" y="150" width="120" height="80" fill="#f59e0b" rx="8"/>
  <text x="110" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Generate</text>
  <text x="110" y="195" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Report</text>
  <text x="110" y="215" text-anchor="middle" fill="#fde68a" font-family="Arial" font-size="10">Create performance report</text>
  
  <rect x="230" y="150" width="120" height="80" fill="#8b5cf6" rx="8"/>
  <text x="290" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">AI</text>
  <text x="290" y="195" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">Insights</text>
  <text x="290" y="215" text-anchor="middle" fill="#ddd6fe" font-family="Arial" font-size="10">Get AI recommendations</text>
</svg>''',

    'budgets-overview.png': '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="250" fill="#f8fafc"/>
  <text x="200" y="25" text-anchor="middle" fill="#1f2937" font-family="Arial" font-size="16" font-weight="bold">Budget Management</text>
  
  <!-- Budget list -->
  <rect x="20" y="40" width="360" height="40" fill="#ffffff" rx="4" stroke="#e5e7eb"/>
  <text x="30" y="55" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Q4 2024 Budget</text>
  <text x="30" y="70" fill="#6b7280" font-family="Arial" font-size="10">$1,000,000 allocated • 68% used</text>
  <rect x="300" y="50" width="60" height="20" fill="#10b981" rx="10"/>
  <text x="330" y="63" text-anchor="middle" fill="white" font-family="Arial" font-size="10">Active</text>
  
  <rect x="20" y="90" width="360" height="40" fill="#ffffff" rx="4" stroke="#e5e7eb"/>
  <text x="30" y="105" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Q3 2024 Budget</text>
  <text x="30" y="120" fill="#6b7280" font-family="Arial" font-size="10">$850,000 allocated • 95% used</text>
  <rect x="300" y="100" width="60" height="20" fill="#6b7280" rx="10"/>
  <text x="330" y="113" text-anchor="middle" fill="white" font-family="Arial" font-size="10">Closed</text>
  
  <rect x="20" y="140" width="360" height="40" fill="#ffffff" rx="4" stroke="#e5e7eb"/>
  <text x="30" y="155" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Q1 2025 Budget</text>
  <text x="30" y="170" fill="#6b7280" font-family="Arial" font-size="10">$1,200,000 allocated • 0% used</text>
  <rect x="300" y="150" width="60" height="20" fill="#f59e0b" rx="10"/>
  <text x="330" y="163" text-anchor="middle" fill="white" font-family="Arial" font-size="10">Draft</text>
  
  <!-- Summary -->
  <rect x="20" y="200" width="360" height="30" fill="#f3f4f6" rx="4"/>
  <text x="30" y="220" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Total Budget: $3,050,000</text>
  <text x="300" y="220" fill="#374151" font-family="Arial" font-size="12">Available: $975,000</text>
</svg>''',

    'promotions-overview.png': '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="250" fill="#f8fafc"/>
  <text x="200" y="25" text-anchor="middle" fill="#1f2937" font-family="Arial" font-size="16" font-weight="bold">Promotion Management</text>
  
  <!-- Promotion cards -->
  <rect x="20" y="40" width="170" height="90" fill="#ffffff" rx="8" stroke="#e5e7eb"/>
  <rect x="25" y="45" width="160" height="4" fill="#10b981" rx="2"/>
  <text x="30" y="65" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Summer Sale 2024</text>
  <text x="30" y="80" fill="#6b7280" font-family="Arial" font-size="10">Walmart, Target • Electronics</text>
  <text x="30" y="95" fill="#6b7280" font-family="Arial" font-size="10">Budget: $50,000</text>
  <text x="30" y="110" fill="#6b7280" font-family="Arial" font-size="10">ROI: 3.2x</text>
  <rect x="140" y="115" width="40" height="15" fill="#10b981" rx="7"/>
  <text x="160" y="125" text-anchor="middle" fill="white" font-family="Arial" font-size="8">Active</text>
  
  <rect x="210" y="40" width="170" height="90" fill="#ffffff" rx="8" stroke="#e5e7eb"/>
  <rect x="215" y="45" width="160" height="4" fill="#3b82f6" rx="2"/>
  <text x="220" y="65" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Back to School</text>
  <text x="220" y="80" fill="#6b7280" font-family="Arial" font-size="10">Costco, Best Buy • Books</text>
  <text x="220" y="95" fill="#6b7280" font-family="Arial" font-size="10">Budget: $35,000</text>
  <text x="220" y="110" fill="#6b7280" font-family="Arial" font-size="10">ROI: 2.8x</text>
  <rect x="330" y="115" width="40" height="15" fill="#f59e0b" rx="7"/>
  <text x="350" y="125" text-anchor="middle" fill="white" font-family="Arial" font-size="8">Planned</text>
  
  <rect x="20" y="150" width="170" height="90" fill="#ffffff" rx="8" stroke="#e5e7eb"/>
  <rect x="25" y="155" width="160" height="4" fill="#6b7280" rx="2"/>
  <text x="30" y="175" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Holiday Special</text>
  <text x="30" y="190" fill="#6b7280" font-family="Arial" font-size="10">All Customers • All Products</text>
  <text x="30" y="205" fill="#6b7280" font-family="Arial" font-size="10">Budget: $75,000</text>
  <text x="30" y="220" fill="#6b7280" font-family="Arial" font-size="10">ROI: 4.1x</text>
  <rect x="140" y="225" width="40" height="15" fill="#6b7280" rx="7"/>
  <text x="160" y="235" text-anchor="middle" fill="white" font-family="Arial" font-size="8">Ended</text>
  
  <rect x="210" y="150" width="170" height="90" fill="#ffffff" rx="8" stroke="#e5e7eb"/>
  <rect x="215" y="155" width="160" height="4" fill="#e11d48" rx="2"/>
  <text x="220" y="175" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Spring Launch</text>
  <text x="220" y="190" fill="#6b7280" font-family="Arial" font-size="10">Home Depot • Garden</text>
  <text x="220" y="205" fill="#6b7280" font-family="Arial" font-size="10">Budget: $25,000</text>
  <text x="220" y="220" fill="#6b7280" font-family="Arial" font-size="10">ROI: 2.1x</text>
  <rect x="330" y="225" width="40" height="15" fill="#e11d48" rx="7"/>
  <text x="350" y="235" text-anchor="middle" fill="white" font-family="Arial" font-size="8">Review</text>
</svg>''',

    'settings-overview.png': '''<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="250" fill="#f8fafc"/>
  <text x="200" y="25" text-anchor="middle" fill="#1f2937" font-family="Arial" font-size="16" font-weight="bold">System Settings</text>
  
  <!-- Settings tabs -->
  <rect x="20" y="40" width="60" height="30" fill="#3b82f6" rx="4"/>
  <text x="50" y="58" text-anchor="middle" fill="white" font-family="Arial" font-size="10">Profile</text>
  
  <rect x="90" y="40" width="60" height="30" fill="#e5e7eb" rx="4"/>
  <text x="120" y="58" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="10">Security</text>
  
  <rect x="160" y="40" width="80" height="30" fill="#e5e7eb" rx="4"/>
  <text x="200" y="58" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="10">Notifications</text>
  
  <rect x="250" y="40" width="60" height="30" fill="#e5e7eb" rx="4"/>
  <text x="280" y="58" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="10">Display</text>
  
  <rect x="320" y="40" width="60" height="30" fill="#e5e7eb" rx="4"/>
  <text x="350" y="58" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="10">API</text>
  
  <!-- Profile form -->
  <rect x="20" y="80" width="360" height="150" fill="#ffffff" rx="8" stroke="#e5e7eb"/>
  
  <text x="30" y="105" fill="#374151" font-family="Arial" font-size="12" font-weight="bold">Profile Information</text>
  
  <text x="30" y="125" fill="#6b7280" font-family="Arial" font-size="10">Name</text>
  <rect x="30" y="130" width="150" height="20" fill="#f9fafb" rx="4" stroke="#d1d5db"/>
  <text x="35" y="143" fill="#374151" font-family="Arial" font-size="10">Admin User</text>
  
  <text x="200" y="125" fill="#6b7280" font-family="Arial" font-size="10">Email</text>
  <rect x="200" y="130" width="150" height="20" fill="#f9fafb" rx="4" stroke="#d1d5db"/>
  <text x="205" y="143" fill="#374151" font-family="Arial" font-size="10">admin@testcompany.demo</text>
  
  <text x="30" y="165" fill="#6b7280" font-family="Arial" font-size="10">Role</text>
  <rect x="30" y="170" width="150" height="20" fill="#f9fafb" rx="4" stroke="#d1d5db"/>
  <text x="35" y="183" fill="#374151" font-family="Arial" font-size="10">Administrator</text>
  
  <text x="200" y="165" fill="#6b7280" font-family="Arial" font-size="10">Department</text>
  <rect x="200" y="170" width="150" height="20" fill="#f9fafb" rx="4" stroke="#d1d5db"/>
  <text x="205" y="183" fill="#374151" font-family="Arial" font-size="10">IT</text>
  
  <rect x="300" y="200" width="60" height="25" fill="#3b82f6" rx="4"/>
  <text x="330" y="215" text-anchor="middle" fill="white" font-family="Arial" font-size="10">Save</text>
</svg>'''
}

# Create the images
for filename, svg_content in image_templates.items():
    filepath = os.path.join(images_dir, filename)
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            f.write(svg_content)
        print(f"Created {filename}")
    else:
        print(f"Skipped {filename} (already exists)")

print(f"\nCreated walkthrough images in {images_dir}")