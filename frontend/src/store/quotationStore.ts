import { defineStore } from "pinia";
import quotationService from "../services/quotationService";
import type Quotation from "../types/quotation";
import { useIndexStore } from "./indexStore";
import { useInvoiceStore } from "./invoiceStore";
const indexStore = useIndexStore();
const invoiceStore = useInvoiceStore()

export const useQuotationStore = defineStore("quotationStore", {
  state: () => ({
    quotations: [] as Quotation[],
    count: 0,
  }),
  actions: {
    async getQuotations(query: any) {
      const { data } : { data: { rows: Quotation[], count: string } } = await quotationService.getQuotations(query.CustomerId, query);
      this.quotations = [ ...data.rows ];
      this.count = +data.count;
      return this.quotations;
    },
    async getQuotation(customerId: string, quotationId: string) {
      const res = await quotationService.getQuotation(customerId, quotationId);
      return res.data;
    },
    async getQuotationPDF(customerId: string, quotationId: string) {
      const res = await quotationService.getQuotationPDF(customerId, quotationId);
      return res;
    },
    async createQuotation(quotationData: Quotation) {
      try {
        const res = await quotationService.createQuotation(quotationData);
        this.addQuotation(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async convertToInvoice(quotationData: Quotation) {
      try {
        const res = await quotationService.convertToInvoice(quotationData.CustomerId, quotationData.id);
        this.updateStore(res.data);
        invoiceStore.addInvoice(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateQuotation(quotationData: Quotation) {
      try {
        const res = await quotationService.updateQuotation(quotationData)
        this.updateStore(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async deleteQuotation(customerId: string, quotationId: string) {
      try {
        await quotationService.destroyQuotation(customerId, quotationId)
        const quotationIndex = this.quotations.findIndex(
          (item) => item.id === quotationId
        );
        if (quotationIndex >= 0) this.quotations.splice(quotationIndex, 1);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    updateStore(quotation) {
      const quotationIndex = this.quotations.findIndex(
        (item) => item.id === quotation.id
      );
      if (quotationIndex !== -1) {
        this.quotations.splice(
          quotationIndex,
          1,
          quotation
        );
      }
    },
    addQuotation(quotation) {
      this.quotations.unshift(quotation);
    }
  }
});