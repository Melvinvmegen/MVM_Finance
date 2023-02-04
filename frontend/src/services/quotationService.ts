import api from "./api";
import type Quotation from "../types/quotation";
import { useUserStore } from "../store/userStore"
const userStore = useUserStore()

class QuotationService {
  getQuotations(customerId: string, query: any): Promise<any> {
    const queryParams = query;
    return api.get(`user/${userStore.auth.userId}/customers/${customerId}/quotations`, {
      params: queryParams,
    });
  }

  createQuotation(quotationData: Quotation): Promise<any> {
    return api.post(`user/${userStore.auth.userId}/customers/${quotationData.CustomerId}/quotations`, quotationData);
  }

  updateQuotation(quotationData: Quotation): Promise<any> {
    return api.put(`user/${userStore.auth.userId}/customers/${quotationData.CustomerId}/quotations/${quotationData.id}`, quotationData);
  }

  getQuotation(customerId: string, quotationId: string): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/customers/${customerId}/quotations/${quotationId}`);
  }

  getQuotationPDF(customerId: string, quotationId: string): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/customers/${customerId}/quotations/${quotationId}`, {
      responseType: "blob",
      params: { pdf: true },
    });
  }

  convertToInvoice(customerId: number, quotationId: string): Promise<any> {
    return api.post(`user/${userStore.auth.userId}/customers/${customerId}/quotations/convert_quotation/${quotationId}`);
  }

  destroyQuotation(customerId: string, quotationId: string): Promise<any> {
    return api.delete(`user/${userStore.auth.userId}/customers/${customerId}/quotations/${quotationId}`);
  }
}

export default new QuotationService();
