import { Branch, SKURule, CategoryRule, StockItem, AllocationResult } from '../types';

/**
 * Distributes stock among branches based on SKU rules, Category rules, and store weights.
 * 
 * Mathematical Logic for Shortage:
 * Let S = central stock, Ti = target for branch i, Wi = weight for branch i.
 * Claim for branch i = Ti * Wi
 * Total Claims = Sum(Ti * Wi)
 * 
 * If S >= Sum(Ti): Allocate Ti to all branches.
 * If S < Sum(Ti):
 *   1. Calculate raw allocation: (Claim / Total Claims) * S
 *   2. Base allocation: Floor(raw allocation) (Capped at Ti)
 *   3. Remainder: S - Sum(Base allocation)
 *   4. Sort branches by their fractional remainder (raw - base) descending.
 *   5. Distribute Remainder stock 1 unit at a time to the top branches.
 */
export function allocateStock(
  stockItems: StockItem[],
  branches: Branch[],
  skuRules: SKURule[],
  categoryRules: CategoryRule[] = []
): AllocationResult[] {
  const results: AllocationResult[] = [];

  // Create a lookup map for rules by SKU and Category
  const ruleMap = new Map<string, SKURule>();
  skuRules.forEach(rule => {
    ruleMap.set(rule.sku.toUpperCase(), rule);
  });

  const categoryRuleMap = new Map<string, CategoryRule>();
  categoryRules.forEach(rule => {
    categoryRuleMap.set(rule.category.toUpperCase(), rule);
  });

  for (const item of stockItems) {
    let rule: SKURule | CategoryRule | undefined = ruleMap.get(item.sku.toUpperCase());
    
    // Fallback to category rule if no specific SKU rule exists
    if (!rule && item.category) {
      rule = categoryRuleMap.get(item.category.toUpperCase());
    }

    const centralStock = item.availableQuantity;

    if (!rule) {
      // No rule defined for this SKU, cannot allocate
      results.push({
        sku: item.sku,
        description: item.description,
        centralStock,
        totalTarget: 0,
        totalAllocated: 0,
        fillRate: 0,
        isOOS: centralStock <= 0,
        details: []
      });
      continue;
    }

    let totalEffectiveTarget = 0;
    let totalClaim = 0;

    // Calculate claims
    const branchClaims = branches.map(branch => {
      const fullTarget = rule.targets[branch.id] || 0;
      const currentStock = item.branchStocks?.[branch.id] || 0;
      
      // Effective target is the shortfall
      const effectiveTarget = Math.max(0, fullTarget - currentStock);
      
      const weight = branch.weight || 1;
      const claim = effectiveTarget * weight;
      
      totalEffectiveTarget += effectiveTarget;
      totalClaim += claim;
      
      return { 
        branch, 
        fullTarget,
        currentStock,
        effectiveTarget, 
        claim, 
        allocated: 0, 
        fraction: 0 
      };
    });

    let totalAllocated = 0;

    if (totalEffectiveTarget === 0) {
      // Edge case: rule exists but all targets are 0 or fully stocked
      branchClaims.forEach(bc => bc.allocated = 0);
    } else if (centralStock >= totalEffectiveTarget) {
      // Fully satisfy all shortfalls
      branchClaims.forEach(bc => {
        bc.allocated = bc.effectiveTarget;
        totalAllocated += bc.effectiveTarget;
      });
    } else if (centralStock > 0 && totalClaim > 0) {
      // Shortage: proportional allocation based on claims
      let remainingStock = centralStock;

      // First pass: floor allocation
      branchClaims.forEach(bc => {
        const rawAllocation = (bc.claim / totalClaim) * centralStock;
        // Cap raw allocation so a branch doesn't get more than its effective target
        const cappedRaw = Math.min(rawAllocation, bc.effectiveTarget);
        
        bc.allocated = Math.floor(cappedRaw);
        bc.fraction = cappedRaw - bc.allocated;
        
        remainingStock -= bc.allocated;
        totalAllocated += bc.allocated;
      });

      // Second pass: distribute remainder based on highest fractional remainders
      // We sort branches by the fraction they lost due to rounding down
      branchClaims.sort((a, b) => b.fraction - a.fraction);
      
      for (let i = 0; i < branchClaims.length && remainingStock > 0; i++) {
        if (branchClaims[i].allocated < branchClaims[i].effectiveTarget) {
          branchClaims[i].allocated += 1;
          remainingStock -= 1;
          totalAllocated += 1;
        }
      }
    }

    // Re-sort branch claims to match the original branches array order for consistent display
    const finalDetails = branches.map(branch => {
      const bc = branchClaims.find(b => b.branch.id === branch.id)!;
      return {
        branchId: bc.branch.id,
        branchName: bc.branch.name,
        target: bc.fullTarget,
        currentStock: bc.currentStock,
        allocated: bc.allocated
      };
    });

    results.push({
      sku: item.sku,
      description: item.description,
      centralStock,
      totalTarget: totalEffectiveTarget,
      totalAllocated,
      fillRate: totalEffectiveTarget > 0 ? totalAllocated / totalEffectiveTarget : 1, // If effective target is 0, we're 100% fulfilled.
      isOOS: centralStock <= 0 && totalEffectiveTarget > 0,
      details: finalDetails
    });
  }

  return results;
}
