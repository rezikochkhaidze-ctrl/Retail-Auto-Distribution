export interface Branch {
  id: string;
  name: string;
  weight: number; // 1-10 priority ranking
}

export interface SKURule {
  id: string;
  sku: string;
  description: string;
  targets: Record<string, number>; // branchId -> target quantity
}

export interface StockItem {
  sku: string;
  description: string;
  availableQuantity: number;
  branchStocks?: Record<string, number>;
}

export interface AllocationDetail {
  branchId: string;
  branchName: string;
  target: number;
  currentStock: number;
  allocated: number;
}

export interface AllocationResult {
  sku: string;
  description: string;
  centralStock: number;
  totalTarget: number;
  totalAllocated: number;
  fillRate: number; // totalAllocated / totalTarget
  isOOS: boolean;
  details: AllocationDetail[];
}
