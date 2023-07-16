import { defineStore } from "pinia";
import {
  getInvoices,
  getInvoice,
  downloadInvoice,
  sendInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "../utils/generated/api-user";
import type { Invoices } from "../../types/models";
import { useIndexStore } from "./indexStore";
const indexStore = useIndexStore();

export const useInvoiceStore = defineStore("invoiceStore", {
  state: () => ({
    invoices: [] as Invoices[],
    count: 0,
  }),
  actions: {
    async getInvoices(query: any) {
      const { data }: { data: { rows: Invoices[]; count: string } } = await getInvoices(query.CustomerId, query);
      this.invoices = [...data.rows];
      this.count = +data.count;
      return this.invoices;
    },
    async getInvoice(customerId: string, invoiceId: string) {
      const res = await getInvoice(customerId, invoiceId);
      return res.data;
    },
    async getInvoicePDF(customerId: string, invoiceId: string) {
      const res = await downloadInvoice(customerId, invoiceId);
      return res;
    },
    async sendEmailInvoice(customerId: string, invoiceId: Invoices) {
      const res = await sendInvoice(customerId, invoiceId);
      return res;
    },
    async createInvoice(customerId: string, invoiceData: Invoices) {
      try {
        const res = await createInvoice(customerId, invoiceData);
        this.addInvoice(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateInvoice(customerId: string, invoiceData: Invoices) {
      try {
        const res = await updateInvoice(customerId, invoiceData.id, invoiceData);
        const invoiceIndex = this.invoices.findIndex((item) => item.id === invoiceData.id);
        if (invoiceIndex !== -1) {
          this.invoices.splice(invoiceIndex, 1, res.data);
        }
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async deleteInvoice(customerId: string, invoiceId: string) {
      try {
        await deleteInvoice(customerId, invoiceId);
        const invoiceIndex = this.invoices.findIndex((item) => "" + item.id === invoiceId);
        if (invoiceIndex >= 0) this.invoices.splice(invoiceIndex, 1);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    addInvoice(invoice: Invoices) {
      this.invoices.unshift(invoice);
    },
  },
});
