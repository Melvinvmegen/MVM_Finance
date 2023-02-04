import api from "./api";
import type Invoice from "../types/invoice";
import { useUserStore } from "../store/userStore"
const userStore = useUserStore()

class InvoiceService {
  getInvoices(customerId: string, query: any): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/customers/${customerId}/invoices`, { params: query });
  }

  createInvoice(invoiceData: Invoice): Promise<any> {
    return api.post(`user/${userStore.auth.userId}/customers/${invoiceData.CustomerId}/invoices`, invoiceData);
  }

  updateInvoice(invoiceData: Invoice): Promise<any> {
    return api.put(`user/${userStore.auth.userId}/customers/${invoiceData.CustomerId}/invoices/${invoiceData.id}`, invoiceData);
  }

  getInvoice(customerId: string, invoiceId: string): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/customers/${customerId}/invoices/${invoiceId}`);
  }

  sendEmailInvoice(invoice: Invoice): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/customers/${invoice.CustomerId}/invoices/send_invoice`, { params: invoice });
  }

  getInvoicePDF(customerId: string, invoiceId: string): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/customers/${customerId}/invoices/${invoiceId}`, {
      responseType: "blob",
      params: { pdf: true },
    });
  }

  destroyInvoice(customerId: string, invoiceId: string): Promise<any> {
    return api.delete(`user/${userStore.auth.userId}/customers/${customerId}/invoices/${invoiceId}`);
  }
}

export default new InvoiceService();
