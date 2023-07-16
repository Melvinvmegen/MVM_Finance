import { defineStore } from "pinia";
import { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer } from "../utils/generated/api-user";
import type { Customers } from "../../types/models";
import { useIndexStore } from "./indexStore";
const indexStore = useIndexStore();

export const useCustomerStore = defineStore("customerStore", {
  state: () => ({
    customers: [] as Customers[],
    count: 0,
  }),
  actions: {
    async getCustomers(query: any) {
      this.customers = [];
      const { data }: { data: { rows: Customers[]; count: string } } = await getCustomers(query);
      this.customers = [...data.rows];
      this.count = +data.count;
      return this.customers;
    },
    async getCustomer(customerId: string) {
      const res = await getCustomer(customerId);
      return res.data;
    },
    async createCustomer(customerData: Customers) {
      try {
        const res = await createCustomer(customerData);
        this.customers.unshift(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateCustomer(customerData: Customers) {
      try {
        await updateCustomer(customerData.id, customerData);
        const customerIndex = this.customers.findIndex((item) => item.id === customerData.id);
        if (customerIndex !== -1) {
          this.customers.splice(customerIndex, 1, customerData);
        }
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async deleteCustomer(customerId: string) {
      try {
        await deleteCustomer(customerId);
        const customerIndex = this.customers.findIndex((item) => "" + item.id === customerId);
        if (customerIndex >= 0) this.customers.splice(customerIndex, 1);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
  },
});
