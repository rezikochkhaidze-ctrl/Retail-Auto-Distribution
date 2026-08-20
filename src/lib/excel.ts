import * as XLSX from 'xlsx';
import { StockItem, AllocationResult, Branch } from '../types';

export async function parseStockExcel(file: File, branches: Branch[]): Promise<StockItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const json = XLSX.utils.sheet_to_json(worksheet);

        // Map expected columns (be flexible with casing)
        const items: StockItem[] = json.map((row: any) => {
          const sku = String(row['SKU'] || row['sku'] || row['Sku'] || '').trim();
          const description = String(row['Description'] || row['description'] || row['Desc'] || '').trim();
          
          let qtyRaw = row['Available Quantity'] || row['Quantity'] || row['qty'] || row['Stock'] || row['Central Stock'];
          let qty = Number(qtyRaw);
          if (isNaN(qty)) qty = 0;

          const branchStocks: Record<string, number> = {};
          branches.forEach(branch => {
            const key = Object.keys(row).find(k => k.toLowerCase().includes(branch.name.toLowerCase()));
            let branchQty = key ? Number(row[key]) : 0;
            if (isNaN(branchQty)) branchQty = 0;
            branchStocks[branch.id] = Math.max(0, branchQty);
          });

          return {
            sku,
            description,
            availableQuantity: Math.max(0, qty),
            branchStocks
          };
        }).filter(item => item.sku !== ''); // Filter out empty rows

        resolve(items);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function exportAllocationExcel(results: AllocationResult[], branches: Branch[], filename: string = 'Distribution_Plan.xlsx') {
  const data = results.map(result => {
    const row: any = {
      SKU: result.sku,
      Description: result.description,
      'Central Stock': result.centralStock,
      'Total Target': result.totalTarget,
      'Total Allocated': result.totalAllocated,
      'Fill Rate': `${(result.fillRate * 100).toFixed(1)}%`,
      'Status': result.isOOS ? 'OOS' : (result.fillRate < 1 ? 'Shortage' : 'Fulfilled')
    };

    // Add columns dynamically for each branch's target and allocation
    branches.forEach(branch => {
      const detail = result.details.find(d => d.branchId === branch.id);
      row[`${branch.name} Target`] = detail?.target || 0;
      row[`${branch.name} Current`] = detail?.currentStock || 0;
      row[`${branch.name} Allocated`] = detail?.allocated || 0;
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Allocation Plan');
  XLSX.writeFile(workbook, filename);
}
