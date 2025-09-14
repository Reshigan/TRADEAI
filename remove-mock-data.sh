#!/bin/bash

# Script to remove all mock data from frontend components
# This script will replace mock data with proper API calls

echo "🧹 Removing mock data from all frontend components..."

# List of files with mock data
FILES=(
    "frontend/src/components/users/UserDetail.js"
    "frontend/src/components/users/UserForm.js"
    "frontend/src/components/promotions/PromotionDetail.js"
    "frontend/src/components/budgets/BudgetForm.js"
    "frontend/src/components/budgets/BudgetDetail.js"
    "frontend/src/components/customers/CustomerDetail.js"
    "frontend/src/components/products/ProductDetail.js"
    "frontend/src/components/tradeSpends/TradeSpendDetail.js"
    "frontend/src/components/tradeSpends/TradeSpendList.js"
    "frontend/src/components/companies/CompanyDetail.js"
    "frontend/src/components/companies/CompanyForm.js"
    "frontend/src/components/reports/ReportBuilder.js"
)

# Function to backup a file
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "$file.backup"
        echo "✅ Backed up $file"
    fi
}

# Function to remove mock data patterns
remove_mock_data() {
    local file=$1
    if [ -f "$file" ]; then
        echo "🔧 Processing $file..."
        
        # Remove mock data declarations
        sed -i '/\/\/ Mock data for development/,/^};$/d' "$file"
        sed -i '/const mock[A-Za-z]* = \[/,/^];$/d' "$file"
        sed -i '/const mock[A-Za-z]* = {/,/^};$/d' "$file"
        
        # Replace mock data usage with API calls
        sed -i 's/setTimeout(() => {/fetchData();/g' "$file"
        sed -i 's/setLoading(false);/\/\/ Loading handled in fetchData/g' "$file"
        sed -i 's/}, 1000);//g' "$file"
        
        echo "✅ Processed $file"
    else
        echo "⚠️  File not found: $file"
    fi
}

# Process each file
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        backup_file "$file"
        remove_mock_data "$file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "🎉 Mock data removal completed!"
echo "📝 Backup files created with .backup extension"
echo "🔍 Please review the changes and test the application"