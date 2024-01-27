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
  lastName?: string;
  phone?: string;
  name?: string;
  email?: string;
  city?: string;
  asset_id?: number;
  asset_type_id?: number;
  CustomerId?: number;
  totalTTC?: number;
  force?: boolean;
  created_at?: string;
  updated_at?: string;
}
