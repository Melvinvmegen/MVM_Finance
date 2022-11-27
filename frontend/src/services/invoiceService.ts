import api from "./api";
import type Invoice from "../types/invoice";

class InvoiceService {
  getInvoices(query: any): Promise<any> {
    const queryParams = query;
    return api.get("user/invoices", { params: queryParams });
  }

  createInvoice(invoiceData: Invoice): Promise<any> {
    return api.post("user/invoice", invoiceData);
  }

  updateInvoice(invoiceData: Invoice): Promise<any> {
    return api.put(`user/invoice/${invoiceData.id}`, invoiceData);
  }

  getInvoice(invoiceId: string): Promise<any> {
    return api.get(`user/invoice/${invoiceId}`);
  }

  sendEmailInvoice(invoice: Invoice): Promise<any> {
    return api.get("user/send_invoice", { params: invoice });
  }

  getInvoicePDF(invoiceId: string): Promise<any> {
    return api.get(`user/invoice/${invoiceId}`, {
      responseType: "blob",
      params: { pdf: true },
    });
  }

  destroyInvoice(invoiceId: string): Promise<any> {
    return api.delete(`user/invoice/${invoiceId}`);
  }
}

export default new InvoiceService();
