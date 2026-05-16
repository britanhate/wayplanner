export type Point = {
  id?: number;
  name: string;
  lat: number;
  lng: number;
  type?: string;
  note?: string | null;
  point_date?: string | null;
  estimated_cost?: number | null;
  is_completed?: boolean;
  created_by?: string | null;
};

export type Expense = {
  id?: number;
  point_id?: number | null;
  category: string;
  amount: number;
  currency: string;
  note?: string | null;
  created_by?: string | null;
  created_at?: string;
};

export type RouteStep = {
  icon: string;
  color: string;
  main: string;
  sub: string | null;
};

export type RouteLeg = {
  totalDurSec?: number;
  totalDistM?: number;
  steps?: RouteStep[];
};

export type MetroMap = {
  city: string;
  title: string;
  image: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  color: string;
  avatar: string;
};
