# Frontend Directory Migration Guide

**Date:** November 13, 2025  
**Migration:** Consolidation to Single Canonical Frontend

---

## Overview

This document explains the consolidation of multiple frontend directories into a single canonical version for the TRADEAI platform.

## Directory Status

### ✅ Canonical Frontend: `frontend/`
- **Version:** 2.1.3
- **Status:** Active and maintained
- **Used By:** 
  - `Dockerfile.frontend`
  - `docker-compose.production.yml`
  - `START_PRODUCTION.sh`
  - `deploy-production-clean.sh`
  - `deploy-simple.sh`
- **Technology:** React 18, Material-UI, Redux, Vite
- **Features:** 
  - Complete AI/ML integration (Ollama LLM, ML backend)
  - Comprehensive component library (customers, promotions, budgets, forecasting)
  - Advanced features (AIChatbot, AIInsights, WalkthroughTour)
  - 349+ tests across unit, integration, and E2E

### ⚠️ Archived: `frontend-v2/` → `_archived/frontend-v2/`
- **Version:** 2.0.0
- **Reason for Archival:** Superseded by `frontend/` (v2.1.3)
- **Key Differences from Canonical:**
  - TypeScript configuration (tsconfig.json)
  - Tailwind CSS instead of Material-UI
  - Different build tooling
  - Contains deployment scripts specific to v2
- **Notable Files:**
  - `FRONTEND_V2_PROGRESS.md` - Development progress notes
  - `AUTHENTICATION.md` - Auth implementation details
  - `PRODUCTION_DEPLOYMENT.md` - Deployment guide
  - `uat-test-agent.py` - UAT testing script
- **Archived On:** November 13, 2025
- **Archived By:** Devin (automated refactoring)

### ⚠️ Archived: `frontend-v3/` → `_archived/frontend-v3/`
- **Version:** 0.0.0 (experimental/incomplete)
- **Reason for Archival:** Experimental version never completed
- **Key Differences from Canonical:**
  - Minimal implementation
  - TypeScript + Tailwind CSS
  - Contains test-auth.html for authentication testing
  - Express server (server.cjs) for serving
- **Archived On:** November 13, 2025
- **Archived By:** Devin (automated refactoring)

---

## Migration Instructions

### For Developers

**If you were working on `frontend-v2/` or `frontend-v3/`:**

1. **Stop using archived directories immediately**
2. **Switch to canonical `frontend/` directory**
3. **Port any custom features to `frontend/`:**
   - Review your changes in archived directory
   - Implement equivalent functionality in `frontend/`
   - Follow existing patterns and conventions
   - Add tests for new features

### For Deployment Scripts

**All deployment scripts should use `frontend/` directory:**

✅ **Already Updated:**
- `Dockerfile.frontend`
- `docker-compose.production.yml`
- `START_PRODUCTION.sh`
- `deploy-production-clean.sh`
- `deploy-simple.sh`

⚠️ **Need Manual Review:**
- `deploy-production.sh` (was using frontend-v2)
- `deploy-to-server.sh` (was using frontend-v2)
- `deploy_complete_system.sh` (was using frontend-v2-temp)

**Action Required:** Update these scripts to use `frontend/` directory.

### For CI/CD Pipelines

**Update any CI/CD configurations to:**
- Build from `frontend/` directory only
- Remove references to `frontend-v2/` and `frontend-v3/`
- Update test paths to `frontend/src/__tests__/`

---

## Retrieving Archived Code

If you need to reference code from archived directories:

```bash
# View archived frontend-v2
ls _archived/frontend-v2/

# Compare specific file with canonical version
diff _archived/frontend-v2/src/App.jsx frontend/src/App.js

# Extract specific feature for porting
cp _archived/frontend-v2/src/components/SomeFeature.jsx frontend/src/components/
```

---

## Technical Comparison

### Technology Stack Differences

| Feature | `frontend/` (Canonical) | `frontend-v2/` | `frontend-v3/` |
|---------|------------------------|----------------|----------------|
| **React Version** | 18.x | 18.x | 18.x |
| **UI Framework** | Material-UI | Tailwind CSS | Tailwind CSS |
| **Language** | JavaScript | TypeScript | TypeScript |
| **Build Tool** | Vite | Vite | Vite |
| **State Management** | Redux | Redux | Redux |
| **Version** | 2.1.3 | 2.0.0 | 0.0.0 |
| **Status** | ✅ Active | ⚠️ Archived | ⚠️ Archived |

### Feature Completeness

| Feature Category | `frontend/` | `frontend-v2/` | `frontend-v3/` |
|-----------------|-------------|----------------|----------------|
| **AI Integration** | ✅ Complete | ⚠️ Partial | ❌ Missing |
| **Customer Management** | ✅ Complete | ✅ Complete | ❌ Minimal |
| **Promotion Management** | ✅ Complete | ✅ Complete | ❌ Minimal |
| **Budget Planning** | ✅ Complete | ⚠️ Partial | ❌ Missing |
| **Forecasting** | ✅ Complete | ⚠️ Partial | ❌ Missing |
| **Reporting** | ✅ Complete | ✅ Complete | ❌ Missing |
| **Test Coverage** | ✅ 349+ tests | ⚠️ Partial | ❌ Minimal |

---

## Rollback Procedure

If you need to temporarily rollback to an archived version:

```bash
# 1. Copy archived version to temporary location
cp -r _archived/frontend-v2 frontend-v2-temp

# 2. Update deployment scripts to use temporary location
# Edit relevant deploy scripts

# 3. Deploy temporary version
./deploy-production.sh

# 4. Report issues to development team
# 5. Plan proper migration to canonical frontend
```

**Note:** Rollback should only be used as emergency measure. Plan migration to canonical `frontend/` as soon as possible.

---

## Questions?

**For questions about this migration:**
- Review this document thoroughly
- Check `frontend/README.md` for canonical frontend documentation
- Review `docs/` directory for technical architecture
- Contact development team lead

**For feature parity questions:**
- Compare archived code with canonical version
- Review git history: `git log --all -- frontend-v2/` or `git log --all -- frontend-v3/`
- Check if feature was intentionally deprecated or needs porting

---

## Changelog

| Date | Action | Details |
|------|--------|---------|
| 2025-11-13 | Initial Migration | Archived `frontend-v2/` and `frontend-v3/` to `_archived/` directory |
| 2025-11-13 | Documentation | Created this migration guide |

---

**Document Owner:** Development Team  
**Last Updated:** November 13, 2025  
**Status:** Active
