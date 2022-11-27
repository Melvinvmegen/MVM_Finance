import type InvoiceItem from "./invoiceItem";
export default interface Invoice {
  id: string;
  company: string;
  lastName: string;
  firstName: string;
  address: string;
  city: string;
  paymentDate: Date;
  total: number;
  paid: boolean;
  CustomerId: number;
  RevenuId: number;
  tvaApplicable: boolean;
  totalTTC: number;
  tvaAmount: number;
  InvoiceItems?: Array<InvoiceItem>;
  count?: number;
  rows?: Array<Invoice>;
}
