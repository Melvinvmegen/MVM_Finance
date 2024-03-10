export * from "../../backend/node_modules/.prisma/client";
export interface Query {
  currentPage?: number;
  perPage?: number;
  sortBy?: {
    key: string;
    order: string;
  };
  id?: number;
  month?: number;
  filter?: string;
  total?: number;
  last_name?: string;
  phone?: string;
  name?: string;
  email?: string;
  city?: string;
  asset_id?: number;
  asset_type_id?: number;
  customer_id?: number;
  total_ttc?: number;
  force?: boolean;
  created_at?: string;
  updated_at?: string;
}
