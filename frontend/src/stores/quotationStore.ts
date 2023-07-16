import { defineStore } from "pinia";
import {
  getQuotations,
  getQuotation,
  sendQuotation,
  createQuotation,
  deleteQuotation,
  updateQuotation,
  convertQuotationToInvoice,
  downloadQuotation,
} from "../utils/generated/api-user";
import type { Quotations } from "../../types/models";
import { useIndexStore } from "./indexStore";
import { useInvoiceStore } from "./invoiceStore";
const indexStore = useIndexStore();
const invoiceStore = useInvoiceStore();

export const useQuotationStore = defineStore("quotationStore", {
  state: () => ({
    quotations: [] as Quotations[],
    count: 0,
  }),
  actions: {
    async getQuotations(query: any) {
      const { data }: { data: { rows: Quotations[]; count: string } } = await getQuotations(query.CustomerId, query);
      this.quotations = [...data.rows];
      this.count = +data.count;
      return this.quotations;
    },
    async getQuotation(customerId: string, quotationId: string) {
      const res = await getQuotation(customerId, quotationId);
      return res.data;
    },
    async getQuotationPDF(customerId: string, quotationId: string) {
      const res = await downloadQuotation(customerId, quotationId);
      return res;
    },
    async sendEmailQuotation(customerId: string, quotationId: string) {
      const res = await sendQuotation(customerId, quotationId);
      return res;
    },
    async createQuotation(quotationData: Quotations) {
      try {
        const res = await createQuotation(quotationData.CustomerId, quotationData);
        this.addQuotation(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async convertToInvoice(quotationData: Quotations) {
      try {
        const res = await convertQuotationToInvoice(quotationData.CustomerId, "" + quotationData.id);
        this.updateStore(res.data);
        invoiceStore.addInvoice(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateQuotation(quotationData: Quotations) {
      try {
        const res = await updateQuotation(quotationData.CustomerId, quotationData.id, quotationData);
        this.updateStore(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async deleteQuotation(customerId: string, quotationId: string) {
      try {
        await deleteQuotation(customerId, quotationId);
        const quotationIndex = this.quotations.findIndex((item) => "" + item.id === quotationId);
        if (quotationIndex >= 0) this.quotations.splice(quotationIndex, 1);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    updateStore(quotation) {
      const quotationIndex = this.quotations.findIndex((item) => item.id === quotation.id);
      if (quotationIndex !== -1) {
        this.quotations.splice(quotationIndex, 1, quotation);
      }
    },
    addQuotation(quotation) {
      this.quotations.unshift(quotation);
    },
  },
});
