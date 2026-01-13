
export interface Project {
  id: string | number;
  name: string;
  area: number;
  originalBudget: number;
  execBudget: number;
  paid: number;
}

export interface BudgetSummary {
  totalExec: number;
  totalPaid: number;
  totalArea: number;
  totalOriginal: number;
  overallProgress: number;
}
