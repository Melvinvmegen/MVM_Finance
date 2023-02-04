import { defineStore } from "pinia";
import invoiceService from "../services/invoiceService";
import type Invoice from "../types/invoice";
import { useIndexStore } from "./indexStore"
const indexStore = useIndexStore()

export const useInvoiceStore = defineStore("invoiceStore", {
  state: () => ({
    invoices: [] as Invoice[],
    count: 0,
  }),
  actions: {
    async getInvoices(query: any) {
      const { data } : { data: { rows: Invoice[], count: string } } = await invoiceService.getInvoices(query.CustomerId, query);
      this.invoices = [ ...data.rows ];
      this.count = +data.count;
      return this.invoices;
    },
    async getInvoice(customerId: string, invoiceId: string) {
      const res = await invoiceService.getInvoice(customerId, invoiceId);
      return res.data;
    },
    async getInvoicePDF(customerId: string, invoiceId: string) {
      const res = await invoiceService.getInvoicePDF(customerId, invoiceId);
      return res;
    },
    async sendEmailInvoice(invoice: Invoice) {
      const res = await invoiceService.sendEmailInvoice(invoice);
      return res;
    },
    async createInvoice(invoiceData: Invoice) {
      try {
        const res = await invoiceService.createInvoice(invoiceData);
        this.addInvoice(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateInvoice(invoiceData: Invoice) {
      try {
        const res = await invoiceService.updateInvoice(invoiceData)
        const invoiceIndex = this.invoices.findIndex(
          (item) => item.id === invoiceData.id
        );
        if (invoiceIndex !== -1) {
          this.invoices.splice(
            invoiceIndex,
            1,
            res.data
          );
        }
        return res.data
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async deleteInvoice(customerId: string, invoiceId: string) {
      try {
        await invoiceService.destroyInvoice(customerId, invoiceId)
        const invoiceIndex = this.invoices.findIndex(
          (item) => item.id === invoiceId
        );
        if (invoiceIndex >= 0) this.invoices.splice(invoiceIndex, 1);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    addInvoice(invoice: Invoice) {
      this.invoices.unshift(invoice);
    }
  }
});