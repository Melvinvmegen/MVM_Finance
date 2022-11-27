import api from "./api";
import type Quotation from "../types/quotation";

class QuotationService {
  getQuotations(query: any): Promise<any> {
    const queryParams = query;
    return api.get("/user/quotations", {
      params: queryParams,
    });
  }

  createQuotation(quotationData: Quotation): Promise<any> {
    return api.post("/user/quotation", quotationData);
  }

  updateQuotation(quotationData: Quotation): Promise<any> {
    return api.put(`/user/quotation/${quotationData.id}`, quotationData);
  }

  getQuotation(quotationId: string): Promise<any> {
    return api.get(`/user/quotation/${quotationId}`);
  }

  getQuotationPDF(quotationId: string): Promise<any> {
    return api.get(`/user/quotation/${quotationId}`, {
      responseType: "blob",
      params: { pdf: true },
    });
  }

  convertToInvoice(quotationId: string): Promise<any> {
    return api.post(`/user/convert_quotation/${quotationId}`);
  }

  destroyQuotation(quotationId: string): Promise<any> {
    return api.delete(`/user/quotation/${quotationId}`);
  }
}

export default new QuotationService();
