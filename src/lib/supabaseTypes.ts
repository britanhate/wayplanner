import type { Expense, Point } from "../shared/types/domain";

export type SupabasePointRow = Point & {
  id: number;
  trip_id?: string | null;
  updated_at?: string | null;
};

export type SupabaseExpenseRow = Expense & {
  id: number;
  trip_id?: string | null;
  updated_at?: string | null;
};
