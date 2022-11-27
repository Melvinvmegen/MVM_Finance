export default interface InvoiceItem {
  id: undefined;
  quantity: number;
  unit: number;
  total: number;
  name: string;
  markedForDestruction: boolean;
  count: number;
  invoiceId: string | number | undefined;
  quotationId: string | number | undefined;
  _destroy?: boolean;
}
