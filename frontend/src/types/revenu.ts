import type Invoice from "./invoice";
import type Cost from "./cost";
import type Credit from "./credit";
import type Quotation from "./quotation";
import type Transaction from "./transaction";

export default interface Revenu {
  id: null;
  createdAt: Date;
  total: number;
  pro: number;
  perso: number;
  expense: number;
  taxPercentage: number;
  tva_collected: number;
  tva_dispatched: number;
  Invoices: Array<Invoice>;
  Costs: Array<Cost>;
  Credits: Array<Credit>;
  Quotations: Array<Quotation>;
  Transactions: Array<Transaction>;
  count?: number;
  rows?: Array<Revenu>;
  BankId?: number;
}
