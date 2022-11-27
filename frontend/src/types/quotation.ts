import type InvoiceItem from "./invoiceItem";

export default interface Quotation {
  id: string;
  company: string;
  lastName: string;
  firstName: string;
  address: string;
  city: string;
  paymentDate: Date;
  total: number;
  cautionPaid: boolean;
  CustomerId: number;
  RevenuId: number;
  InvoiceId: number;
  tvaApplicable: boolean;
  totalTTC: number;
  tvaAmount: number;
  InvoiceItems?: Array<InvoiceItem>;
  count?: number;
  rows?: Array<Quotation>;
}
