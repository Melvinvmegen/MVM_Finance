import type Invoice from "./invoice";

export default interface Customer {
  id: null;
  lastName: string;
  firstName: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  siret: string;
  Invoices: Array<Invoice>;
  count?: number;
  rows?: Array<Customer>;
}
