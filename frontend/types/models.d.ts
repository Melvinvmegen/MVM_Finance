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
  BankId?: number;
  CustomerId?: number;
  totalTTC?: number;
  force?: boolean;
}
