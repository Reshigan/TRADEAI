/**
 * hierarchyResolver.js — Shared Hierarchy Resolution Service
 *
 * Provides functions used across all modules to resolve customer/product
 * hierarchies, find ancestors/descendants/siblings, and resolve the best
 * matching baseline for a given scope.
 *
 * Customer hierarchy levels (5): national > chain > region > district > store
 * Product hierarchy levels (6): division > category > subcategory > brand > sub_brand > sku
 */

// ── Constants ────────────────────────────────────────────────────────────

const CUSTOMER_LEVELS = ['national', 'chain', 'region', 'district', 'store'];
const PRODUCT_LEVELS = ['division', 'category', 'subcategory', 'brand', 'sub_brand', 'sku'];

const CUSTOMER_LEVEL_DEPTH = Object.fromEntries(CUSTOMER_LEVELS.map((l, i) => [l, i]));
const PRODUCT_LEVEL_DEPTH = Object.fromEntries(PRODUCT_LEVELS.map((l, i) => [l, i]));

// ── Helper: pick the right table name ────────────────────────────────────

function hierarchyTable(type) {
  if (type === 'customer') return 'customer_hierarchy';
  if (type === 'product') return 'product_hierarchy';
  throw new Error(`Unknown hierarchy type: ${type}`);
}

// ── 1. resolveCustomerHierarchy(db, companyId, customerId) ───────────────
/**
 * Given a store-level customer, walk UP to root and return an object with
 * all ancestor levels:
 *   { store: {id, name}, district: {…}, region: {…}, chain: {…}, national: {…} }
 *
 * Falls back to reading the legacy customers table if no customer_hierarchy
 * node is linked.
 */
export async function resolveCustomerHierarchy(db, companyId, customerId) {
  if (!customerId) return null;

  // Try the customer_hierarchy tree first
  const storeNode = await db.prepare(
    `SELECT * FROM customer_hierarchy
     WHERE company_id = ? AND customer_id = ? AND level = 'store' LIMIT 1`
  ).bind(companyId, customerId).first();

  if (storeNode) {
    return await walkUpTree(db, companyId, 'customer', storeNode);
  }

  // Fallback: look up the customer_hierarchy node by customer_id at any level
  const anyNode = await db.prepare(
    `SELECT * FROM customer_hierarchy
     WHERE company_id = ? AND customer_id = ? LIMIT 1`
  ).bind(companyId, customerId).first();

  if (anyNode) {
    return await walkUpTree(db, companyId, 'customer', anyNode);
  }

  // Final fallback: construct a thin object from the customers table
  const customer = await db.prepare(
    'SELECT id, name, region, city, channel FROM customers WHERE id = ? AND company_id = ?'
  ).bind(customerId, companyId).first();

  if (!customer) return null;

  return {
    store: { id: customer.id, name: customer.name },
    district: customer.city ? { id: null, name: customer.city } : null,
    region: customer.region ? { id: null, name: customer.region } : null,
    chain: null,
    national: null
  };
}

// ── 2. resolveProductHierarchy(db, companyId, productId) ─────────────────
/**
 * Given a SKU-level product, walk UP to root and return:
 *   { sku: {id, name}, subBrand: {…}, brand: {…}, subcategory: {…}, category: {…}, division: {…} }
 */
export async function resolveProductHierarchy(db, companyId, productId) {
  if (!productId) return null;

  // Try the product_hierarchy tree
  const skuNode = await db.prepare(
    `SELECT * FROM product_hierarchy
     WHERE company_id = ? AND product_id = ? AND level = 'sku' LIMIT 1`
  ).bind(companyId, productId).first();

  if (skuNode) {
    return await walkUpTree(db, companyId, 'product', skuNode);
  }

  // Try any level match
  const anyNode = await db.prepare(
    `SELECT * FROM product_hierarchy
     WHERE company_id = ? AND product_id = ? LIMIT 1`
  ).bind(companyId, productId).first();

  if (anyNode) {
    return await walkUpTree(db, companyId, 'product', anyNode);
  }

  // Fallback: construct from products table
  const product = await db.prepare(
    'SELECT id, name, category, brand, sub_brand FROM products WHERE id = ? AND company_id = ?'
  ).bind(productId, companyId).first();

  if (!product) return null;

  return {
    sku: { id: product.id, name: product.name },
    subBrand: product.sub_brand ? { id: null, name: product.sub_brand } : null,
    brand: product.brand ? { id: null, name: product.brand } : null,
    subcategory: null,
    category: product.category ? { id: null, name: product.category } : null,
    division: null
  };
}

// ── 3. getDescendants(db, companyId, hierarchyType, nodeId) ──────────────
/**
 * Returns all descendant node IDs under a given node using materialized path.
 * Example: getDescendants('customer', chainNodeId) => all region/district/store IDs
 */
export async function getDescendants(db, companyId, hierarchyType, nodeId) {
  const table = hierarchyTable(hierarchyType);

  // Get the node's path
  const node = await db.prepare(
    `SELECT id, path FROM ${table} WHERE id = ? AND company_id = ?`
  ).bind(nodeId, companyId).first();

  if (!node) return [];

  // Find all nodes whose path starts with this node's path + "/" + nodeId
  const pathPrefix = node.path ? `${node.path}/${nodeId}` : `/${nodeId}`;

  const result = await db.prepare(
    `SELECT id, name, level, level_depth FROM ${table}
     WHERE company_id = ? AND path LIKE ? AND id != ?
     ORDER BY level_depth ASC`
  ).bind(companyId, `${pathPrefix}%`, nodeId).all();

  return (result.results || []).map(r => ({
    id: r.id,
    name: r.name,
    level: r.level,
    levelDepth: r.level_depth
  }));
}

// ── 4. getAncestors(db, companyId, hierarchyType, nodeId) ────────────────
/**
 * Returns all ancestor node IDs from a node up to the root.
 * Uses the materialized path to extract ancestor IDs.
 */
export async function getAncestors(db, companyId, hierarchyType, nodeId) {
  const table = hierarchyTable(hierarchyType);

  const node = await db.prepare(
    `SELECT id, path FROM ${table} WHERE id = ? AND company_id = ?`
  ).bind(nodeId, companyId).first();

  if (!node || !node.path) return [];

  // Path format: "/root-id/chain-id/region-id/..."
  const ancestorIds = node.path.split('/').filter(Boolean);
  if (ancestorIds.length === 0) return [];

  const placeholders = ancestorIds.map(() => '?').join(',');
  const result = await db.prepare(
    `SELECT id, name, level, level_depth FROM ${table}
     WHERE company_id = ? AND id IN (${placeholders})
     ORDER BY level_depth ASC`
  ).bind(companyId, ...ancestorIds).all();

  return (result.results || []).map(r => ({
    id: r.id,
    name: r.name,
    level: r.level,
    levelDepth: r.level_depth
  }));
}

// ── 5. getSiblings(db, companyId, hierarchyType, nodeId) ─────────────────
/**
 * Returns all nodes at the same level under the same parent.
 * Excludes the queried node itself.
 */
export async function getSiblings(db, companyId, hierarchyType, nodeId) {
  const table = hierarchyTable(hierarchyType);

  const node = await db.prepare(
    `SELECT id, parent_id, level FROM ${table} WHERE id = ? AND company_id = ?`
  ).bind(nodeId, companyId).first();

  if (!node) return [];

  let query;
  let params;

  if (node.parent_id) {
    query = `SELECT id, name, level, level_depth FROM ${table}
             WHERE company_id = ? AND parent_id = ? AND id != ?
             ORDER BY name ASC`;
    params = [companyId, node.parent_id, nodeId];
  } else {
    // Root-level node: siblings are other root-level nodes
    query = `SELECT id, name, level, level_depth FROM ${table}
             WHERE company_id = ? AND parent_id IS NULL AND level = ? AND id != ?
             ORDER BY name ASC`;
    params = [companyId, node.level, nodeId];
  }

  const result = await db.prepare(query).bind(...params).all();

  return (result.results || []).map(r => ({
    id: r.id,
    name: r.name,
    level: r.level,
    levelDepth: r.level_depth
  }));
}

// ── 6. getNodesAtLevel(db, companyId, hierarchyType, level, parentId?) ───
/**
 * Returns all nodes at a given level, optionally filtered by parent.
 */
export async function getNodesAtLevel(db, companyId, hierarchyType, level, parentId) {
  const table = hierarchyTable(hierarchyType);

  let query = `SELECT id, name, level, level_depth, parent_id, parent_name, child_count
               FROM ${table} WHERE company_id = ? AND level = ?`;
  const params = [companyId, level];

  if (parentId) {
    query += ' AND parent_id = ?';
    params.push(parentId);
  }

  query += ' ORDER BY name ASC';

  const result = await db.prepare(query).bind(...params).all();

  return (result.results || []).map(r => ({
    id: r.id,
    name: r.name,
    level: r.level,
    levelDepth: r.level_depth,
    parentId: r.parent_id,
    parentName: r.parent_name,
    childCount: r.child_count
  }));
}

// ── 7. resolveBaselineScope(db, companyId, opts) ─────────────────────────
/**
 * CRITICAL function — used by every downstream module.
 *
 * Given optional { customerId, productId, customerHierarchyId, productHierarchyId,
 * customerHierarchyLevel, productHierarchyLevel }, returns the best matching
 * baseline. Implements a waterfall:
 *
 *   1. Exact match: baseline at this customer+product scope
 *   2. Walk UP customer hierarchy (widen customer scope)
 *   3. Walk UP product hierarchy (widen product scope)
 *   4. Walk UP both
 *   5. Company-wide fallback (baseline with NULL scope)
 *   6. If still nothing, attempt to roll up from child baselines
 *
 * Returns: { baseline, periods, source: 'exact'|'ancestor'|'rollup'|'fallback'|null }
 */
export async function resolveBaselineScope(db, companyId, opts = {}) {
  const {
    customerId,
    productId,
    customerHierarchyId,
    productHierarchyId,
    customerHierarchyLevel,
    productHierarchyLevel
  } = opts;

  // Step 1: Try exact match
  const exact = await findBaseline(db, companyId, {
    customerId,
    productId,
    customerHierarchyId,
    productHierarchyId
  });

  if (exact) {
    const periods = await getBaselinePeriods(db, companyId, exact.id);
    return { baseline: exact, periods, source: 'exact' };
  }

  // Step 2: Walk UP customer hierarchy
  if (customerHierarchyId) {
    const ancestors = await getAncestors(db, companyId, 'customer', customerHierarchyId);
    for (const ancestor of ancestors.reverse()) { // start from nearest ancestor
      const match = await findBaseline(db, companyId, {
        customerHierarchyId: ancestor.id,
        productId,
        productHierarchyId
      });
      if (match) {
        const periods = await getBaselinePeriods(db, companyId, match.id);
        return { baseline: match, periods, source: 'ancestor' };
      }
    }
  }

  // Step 3: Walk UP product hierarchy
  if (productHierarchyId) {
    const ancestors = await getAncestors(db, companyId, 'product', productHierarchyId);
    for (const ancestor of ancestors.reverse()) {
      const match = await findBaseline(db, companyId, {
        customerId,
        customerHierarchyId,
        productHierarchyId: ancestor.id
      });
      if (match) {
        const periods = await getBaselinePeriods(db, companyId, match.id);
        return { baseline: match, periods, source: 'ancestor' };
      }
    }
  }

  // Step 4: Company-wide fallback (no specific scope)
  const fallback = await findBaseline(db, companyId, {});
  if (fallback) {
    const periods = await getBaselinePeriods(db, companyId, fallback.id);
    return { baseline: fallback, periods, source: 'fallback' };
  }

  // Step 5: Try rollup from child baselines
  if (customerHierarchyId || productHierarchyId) {
    const rollup = await rollupFromChildren(db, companyId, {
      customerHierarchyId,
      productHierarchyId
    });
    if (rollup) {
      return { baseline: rollup.baseline, periods: rollup.periods, source: 'rollup' };
    }
  }

  return { baseline: null, periods: [], source: null };
}

// ── Internal helpers ─────────────────────────────────────────────────────

/**
 * Walk up the tree from a node, collecting ancestors at each level.
 */
async function walkUpTree(db, companyId, type, startNode) {
  const levels = type === 'customer' ? CUSTOMER_LEVELS : PRODUCT_LEVELS;
  const table = hierarchyTable(type);
  const result = {};

  // Set the starting node
  result[camelLevel(startNode.level)] = { id: startNode.id, name: startNode.name };

  // Walk up via parent_id
  let currentParentId = startNode.parent_id;
  while (currentParentId) {
    const parent = await db.prepare(
      `SELECT id, name, level, parent_id FROM ${table} WHERE id = ? AND company_id = ?`
    ).bind(currentParentId, companyId).first();

    if (!parent) break;

    result[camelLevel(parent.level)] = { id: parent.id, name: parent.name };
    currentParentId = parent.parent_id;
  }

  // Fill in nulls for levels we didn't find
  for (const level of levels) {
    const key = camelLevel(level);
    if (!result[key]) result[key] = null;
  }

  return result;
}

/**
 * Convert level names to camelCase keys.
 * "sub_brand" -> "subBrand", "national" -> "national"
 */
function camelLevel(level) {
  return level.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Find a single active baseline matching the given scope.
 */
async function findBaseline(db, companyId, scope) {
  let query = `SELECT * FROM baselines WHERE company_id = ? AND status IN ('active', 'approved')`;
  const params = [companyId];

  if (scope.customerId) {
    query += ' AND customer_id = ?';
    params.push(scope.customerId);
  }
  if (scope.productId) {
    query += ' AND product_id = ?';
    params.push(scope.productId);
  }
  if (scope.customerHierarchyId) {
    query += ' AND customer_hierarchy_id = ?';
    params.push(scope.customerHierarchyId);
  } else if (!scope.customerId) {
    query += ' AND customer_hierarchy_id IS NULL AND customer_id IS NULL';
  }
  if (scope.productHierarchyId) {
    query += ' AND product_hierarchy_id = ?';
    params.push(scope.productHierarchyId);
  } else if (!scope.productId) {
    query += ' AND product_hierarchy_id IS NULL AND product_id IS NULL';
  }

  query += ' ORDER BY created_at DESC LIMIT 1';

  return await db.prepare(query).bind(...params).first();
}

/**
 * Get baseline periods for a baseline.
 */
async function getBaselinePeriods(db, companyId, baselineId) {
  const result = await db.prepare(
    `SELECT * FROM baseline_periods
     WHERE baseline_id = ? AND company_id = ?
     ORDER BY period_number ASC`
  ).bind(baselineId, companyId).all();

  return result.results || [];
}

/**
 * Attempt to create a synthetic rollup baseline from child-level baselines.
 * Sums volumes, averages seasonality factors, widens confidence intervals.
 */
async function rollupFromChildren(db, companyId, scope) {
  const childIds = [];

  if (scope.customerHierarchyId) {
    const descendants = await getDescendants(db, companyId, 'customer', scope.customerHierarchyId);
    for (const d of descendants) {
      const childBaseline = await findBaseline(db, companyId, {
        customerHierarchyId: d.id,
        productHierarchyId: scope.productHierarchyId
      });
      if (childBaseline) childIds.push(childBaseline.id);
    }
  }

  if (scope.productHierarchyId && childIds.length === 0) {
    const descendants = await getDescendants(db, companyId, 'product', scope.productHierarchyId);
    for (const d of descendants) {
      const childBaseline = await findBaseline(db, companyId, {
        customerHierarchyId: scope.customerHierarchyId,
        productHierarchyId: d.id
      });
      if (childBaseline) childIds.push(childBaseline.id);
    }
  }

  if (childIds.length === 0) return null;

  // Aggregate child baselines
  const placeholders = childIds.map(() => '?').join(',');
  const agg = await db.prepare(
    `SELECT
       SUM(total_base_volume) as total_base_volume,
       SUM(total_base_revenue) as total_base_revenue,
       AVG(avg_weekly_volume) as avg_weekly_volume,
       AVG(avg_weekly_revenue) as avg_weekly_revenue,
       AVG(seasonality_index) as seasonality_index,
       AVG(trend_coefficient) as trend_coefficient,
       AVG(r_squared) as r_squared,
       AVG(mape) as mape,
       AVG(confidence_level) as confidence_level,
       COUNT(*) as child_count
     FROM baselines WHERE id IN (${placeholders}) AND company_id = ?`
  ).bind(...childIds, companyId).first();

  if (!agg || agg.child_count === 0) return null;

  // Aggregate child periods by period_number
  const periodResult = await db.prepare(
    `SELECT
       period_number,
       MIN(period_start) as period_start,
       MAX(period_end) as period_end,
       SUM(base_volume) as base_volume,
       SUM(base_revenue) as base_revenue,
       AVG(seasonality_factor) as seasonality_factor,
       AVG(trend_adjustment) as trend_adjustment,
       SUM(actual_volume) as actual_volume,
       SUM(actual_revenue) as actual_revenue,
       SUM(incremental_volume) as incremental_volume,
       SUM(incremental_revenue) as incremental_revenue,
       COUNT(*) as source_count
     FROM baseline_periods
     WHERE baseline_id IN (${placeholders}) AND company_id = ?
     GROUP BY period_number
     ORDER BY period_number ASC`
  ).bind(...childIds, companyId).all();

  // Build synthetic baseline object
  const syntheticBaseline = {
    id: `rollup-${scope.customerHierarchyId || 'all'}-${scope.productHierarchyId || 'all'}`,
    companyId,
    name: 'Rolled-up Baseline',
    status: 'active',
    baselineType: 'volume',
    totalBaseVolume: agg.total_base_volume || 0,
    totalBaseRevenue: agg.total_base_revenue || 0,
    avgWeeklyVolume: agg.avg_weekly_volume || 0,
    avgWeeklyRevenue: agg.avg_weekly_revenue || 0,
    trendCoefficient: agg.trend_coefficient || 0,
    rSquared: agg.r_squared || 0,
    mape: agg.mape || 0,
    confidenceLevel: Math.max(0, (agg.confidence_level || 0.85) - 0.05), // widen CI for rollup
    childCount: agg.child_count,
    isRollup: true
  };

  const syntheticPeriods = (periodResult.results || []).map(p => ({
    periodNumber: p.period_number,
    periodStart: p.period_start,
    periodEnd: p.period_end,
    baseVolume: p.base_volume || 0,
    baseRevenue: p.base_revenue || 0,
    seasonalityFactor: p.seasonality_factor || 1.0,
    trendAdjustment: p.trend_adjustment || 0,
    actualVolume: p.actual_volume,
    actualRevenue: p.actual_revenue,
    incrementalVolume: p.incremental_volume || 0,
    incrementalRevenue: p.incremental_revenue || 0,
    sourceCount: p.source_count
  }));

  return { baseline: syntheticBaseline, periods: syntheticPeriods };
}

// ── Exports for use in route files ───────────────────────────────────────

export const HIERARCHY_CONSTANTS = {
  CUSTOMER_LEVELS,
  PRODUCT_LEVELS,
  CUSTOMER_LEVEL_DEPTH,
  PRODUCT_LEVEL_DEPTH
};
