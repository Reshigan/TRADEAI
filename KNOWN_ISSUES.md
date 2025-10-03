# Known Issues and Limitations

## Security Vulnerabilities

### 1. xlsx Package Vulnerabilities (HIGH PRIORITY)

**Status**: Open  
**Severity**: High  
**CVE**: Multiple (Prototype Pollution, ReDoS)

**Description**:
The `xlsx` package (v0.18.5) has known high-severity vulnerabilities:
- Prototype Pollution (GHSA-4r6h-8v6p-xvwj)
- Regular Expression Denial of Service (GHSA-5pgg-2g8v-p4x9)

**Impact**:
- Potential for remote code execution via malicious Excel files
- DoS attacks through crafted spreadsheet uploads
- Files affected:
  - `backend/src/services/reportingEngine.js`
  - `backend/src/services/bulkOperationsService.js`

**Recommended Fix**:
Replace `xlsx` with `exceljs` (already installed, more secure):

```javascript
// Old (xlsx):
const XLSX = require('xlsx');
const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

// New (exceljs):
const ExcelJS = require('exceljs');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);
const worksheet = workbook.worksheets[0];
const data = [];
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber > 1) data.push(row.values);
});
```

**Workaround**:
Until migration is complete:
1. Validate all uploaded Excel files before processing
2. Implement file size limits (max 10MB)
3. Run file processing in isolated sandbox
4. Monitor for unusual CPU usage patterns

**Timeline**: Should be fixed before production deployment

---

### 2. @sendgrid/mail axios Dependency (MEDIUM PRIORITY)

**Status**: Open  
**Severity**: High (via transitive dependency)  
**CVE**: GHSA-wf5p-g6vw-rhxx, GHSA-jr5f-v2jv-69x6, GHSA-4hjh-wcwx-xvwj

**Description**:
The `@sendgrid/mail` package depends on an outdated version of `axios` with known vulnerabilities.

**Impact**:
- Cross-Site Request Forgery (CSRF)
- SSRF and Credential Leakage
- Denial of Service

**Recommended Fix**:
```bash
npm install @sendgrid/mail@latest --save
```

**Status**: Requires testing to ensure email functionality works with latest version.

**Timeline**: Can be addressed in next maintenance window

---

## Development Environment

### 1. .env Files Present in Working Directory

**Status**: By Design  
**Severity**: Info

**Description**:
`.env` files exist in the working directory for local development. These are properly excluded from version control via `.gitignore`.

**Note**: These files contain **development credentials only**. Production credentials must be:
1. Stored in secure secrets management (AWS Secrets Manager, HashiCorp Vault)
2. Never committed to version control
3. Rotated regularly (every 90 days)

---

### 2. Hardcoded Credentials in Development Scripts

**Status**: Resolved  
**Severity**: Medium

**Description**:
Development/seed scripts previously contained hardcoded MongoDB credentials.

**Fix Applied**:
- All development scripts moved to `scripts/development/` directory
- Scripts should be updated to use environment variables
- Directory excluded from production deployments

**Remaining Action**:
Update scripts in `scripts/development/` to use `process.env.MONGODB_URI` instead of hardcoded values.

---

## Infrastructure

### 1. Node.js Version Compatibility

**Status**: Info  
**Severity**: Low

**Description**:
Some packages require Node.js v20+:
- `@nestjs/core@11.1.6`
- `file-type@21.0.0`

**Current Environment**: Node.js v18.20.8

**Impact**: Minimal - packages still function with warnings

**Recommendation**:
Upgrade to Node.js v20 LTS in next infrastructure update:
```bash
# Using nvm:
nvm install 20
nvm use 20
```

---

### 2. Deprecated Packages

**Status**: Planned  
**Severity**: Low

**Description**:
Several packages have deprecation warnings:
- `multer@1.4.5-lts.2` → Upgrade to v2.x
- `supertest@6.3.4` → Upgrade to v7.1.3+
- `eslint@8.57.1` → Upgrade to v9.x
- Various glob/rimraf packages

**Impact**: 
- Security vulnerabilities in outdated packages
- Potential compatibility issues in future

**Recommendation**:
Schedule dependency upgrade sprint:
1. Review breaking changes for each package
2. Update in development environment
3. Run full test suite
4. Deploy to staging for validation
5. Roll out to production

---

## Features

### 1. Excel Export Functionality

**Status**: Limited  
**Severity**: Low

**Description**:
Excel export currently uses vulnerable `xlsx` package (see Security Vulnerabilities #1).

**Workaround**:
- Use CSV export as alternative
- PDF reports still fully functional

**Timeline**: Excel exports should be migrated to `exceljs` before production

---

### 2. Email Notifications

**Status**: Functional (with caveats)  
**Severity**: Low

**Description**:
Email functionality uses `@sendgrid/mail` with outdated axios dependency.

**Impact**: Minimal for outgoing emails only

**Monitoring**:
- Check SendGrid dashboard for delivery rates
- Monitor for unusual API errors

---

## Testing

### 1. Integration Tests Require Full Environment

**Status**: By Design  
**Severity**: Info

**Description**:
Integration and E2E tests require:
- Running MongoDB instance
- Running Redis instance
- Proper environment variables

**Setup**:
```bash
# Use docker-compose for test environment
docker-compose -f docker-compose.dev.yml up -d mongodb redis

# Run tests
npm test
```

---

## Monitoring Recommendations

Based on known issues, monitor the following:

### Application Metrics:
- [ ] CPU usage (watch for ReDoS attacks)
- [ ] Memory consumption (watch for memory leaks)
- [ ] Request latency (watch for slowdowns)
- [ ] Error rates (watch for increased failures)

### Security Metrics:
- [ ] Failed authentication attempts
- [ ] File upload patterns
- [ ] Unusual API access patterns
- [ ] Large file uploads (>10MB)

### Infrastructure Metrics:
- [ ] Node.js version in production
- [ ] Package vulnerability count
- [ ] Dependency age (outdated packages)
- [ ] SSL certificate expiration

---

## Issue Priority Matrix

| Issue | Severity | Effort | Priority | Timeline |
|-------|----------|--------|----------|----------|
| xlsx vulnerabilities | High | Medium | **P0** | Before prod |
| SendGrid axios | High | Low | **P1** | Next sprint |
| Dev script hardcoded creds | Medium | Low | **P2** | This sprint |
| Node.js upgrade | Low | Medium | **P3** | Q1 2026 |
| Deprecated packages | Low | High | **P3** | Q1-Q2 2026 |

**Priority Definitions**:
- **P0**: Blocking production deployment
- **P1**: Should fix before production
- **P2**: Should fix in current sprint
- **P3**: Can be scheduled for future sprint

---

## Contributing

If you discover a new security vulnerability or issue:
1. Do NOT create a public GitHub issue
2. Email: security@your-domain.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

---

**Last Updated**: 2025-10-03  
**Next Review**: 2025-10-10  
**Maintained By**: Development Team
