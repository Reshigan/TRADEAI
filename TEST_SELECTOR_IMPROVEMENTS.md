# Improved Test Automation Selectors

## Material-UI Component Selectors

### TextFields
```javascript
// Instead of: 'input[name="name"]'
// Use: '[data-testid="name-field"], .MuiTextField-root input[name="name"]'

// Better approach: Add data-testid to components
<TextField
  data-testid="customer-name-field"
  name="name"
  label="Name"
/>

// Test code:
await page.locator('[data-testid="customer-name-field"]').fill("Test Name")
```

### Select Dropdowns
```javascript
// MUI Select requires special handling
await page.locator('[data-testid="category-select"]').click()
await page.locator('[role="option"]:has-text("Marketing")').click()
```

### Buttons
```javascript
// Instead of: 'button:has-text("Save")'
// Use: '[data-testid="save-button"], button[type="submit"]'

// With MUI:
<Button data-testid="save-button" type="submit">Save</Button>

// Test code:
await page.locator('[data-testid="save-button"]').click()
```

### Dialog/Modal
```javascript
// MUI Dialog requires force click for buttons inside
await page.locator('[data-testid="submit-button"]').click({ force: true })

// Or wait for dialog to be fully rendered
await page.locator('[role="dialog"]').waitFor()
await page.locator('[role="dialog"] button[type="submit"]').click()
```

### Date Pickers
```javascript
// MUI DatePicker
await page.locator('[data-testid="start-date-picker"] input').fill("2025-11-08")

// Or click and select from calendar
await page.locator('[data-testid="start-date-picker"]').click()
await page.locator('[role="dialog"] button:has-text("15")').click()
```

### Autocomplete
```javascript
// MUI Autocomplete
await page.locator('[data-testid="customer-autocomplete"] input').fill("John")
await page.locator('[role="option"]:has-text("John Doe")').click()
```

## Dashboard Widget Selectors

```javascript
// Instead of: '.metric, .card, .widget'
// Use more specific selectors:
const metrics = await page.locator('[data-testid="dashboard-metric"], .dashboard-card, [role="region"]').count()

// Wait for async data loading
await page.waitForTimeout(5000)  // 5 seconds for data

// Or wait for specific content
await page.locator('[data-testid="total-revenue"]').waitFor({ timeout: 10000 })
```

## Table Selectors

```javascript
// Row selection
await page.locator('table tbody tr').first.click()

// Cell selection
const cellValue = await page.locator('table tbody tr:first-child td:nth-child(2)').innerText()

// With data-testid
await page.locator('[data-testid="customer-table"] tbody tr').first.click()
```

## Form Validation

```javascript
// Wait for form errors
const errors = await page.locator('.Mui-error, [role="alert"]').count()

// Check specific field error
const emailError = await page.locator('[data-testid="email-field"] + .Mui-error').innerText()
```

## Recommended Test Pattern

```javascript
class ImprovedTester {
  async fillField(testId, value) {
    // Try data-testid first
    let element = this.page.locator(`[data-testid="${testId}"]`)
    
    if (await element.count() === 0) {
      // Fallback to name attribute
      element = this.page.locator(`input[name="${testId}"], textarea[name="${testId}"]`)
    }
    
    if (await element.count() === 0) {
      // Fallback to MUI pattern
      element = this.page.locator(`.MuiTextField-root input[name="${testId}"]`)
    }
    
    if (await element.count() > 0) {
      await element.first.fill(value)
      return true
    }
    
    return false
  }
  
  async clickButton(testId, force = false) {
    const selectors = [
      `[data-testid="${testId}"]`,
      `button:has-text("${testId}")`,
      `a:has-text("${testId}")`
    ]
    
    for (const selector of selectors) {
      try {
        const element = this.page.locator(selector)
        if (await element.count() > 0) {
          await element.first.click({ force })
          return true
        }
      } catch (e) {
        continue
      }
    }
    
    return false
  }
  
  async waitForNavigation() {
    // Wait for both network idle and URL change
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.page.waitForTimeout(1000)
    ])
  }
}
```

## Best Practices

1. **Always use data-testid attributes** when possible
2. **Wait for async operations** (5-10 seconds for data loading)
3. **Use force: true for modal dialogs**
4. **Multiple selector fallbacks** for robustness
5. **Screenshot on failure** for debugging
6. **Verify navigation** after form submissions
7. **Check for error messages** before asserting success
8. **Wait for elements** before interacting

## Implementation Checklist

- [ ] Add data-testid to all form fields
- [ ] Add data-testid to all buttons
- [ ] Add data-testid to dashboard widgets
- [ ] Add data-testid to table elements
- [ ] Update test scripts with new selectors
- [ ] Increase wait times for async operations
- [ ] Add force clicks for modal dialogs
- [ ] Implement selector fallback patterns

---

**Apply these improvements to achieve 95%+ test pass rate**
