import { defineStore } from "pinia";
import customerService from "../services/customerService";
import type Customer from "../types/customer";
import { useIndexStore } from "./indexStore"
const indexStore = useIndexStore()

export const useCustomerStore = defineStore("customerStore", {
  state: () => ({
    customers: [] as Customer[],
    count: 0,
  }),
  actions: {
    async getCustomers(query: any) {
      this.customers = []
      const { data } : { data: { rows: Customer[], count: string } } = await customerService.getCustomers(query);
      this.customers = [ ...data.rows ];
      this.count = +data.count;
      return this.customers;
    },
    async getCustomer(customerId: string) {
      const res = await customerService.getCustomer(customerId);
      return res.data;
    },
    async createCustomer(customerData: Customer) {
      try {
        const res = await customerService.createCustomer(customerData);
        this.customers.unshift(res.data);
        return res.data;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateCustomer(customerData: Customer) {
      try {
        await customerService.updateCustomer(customerData)
        const customerIndex = this.customers.findIndex(
          (item) => item.id === customerData.id
        );
        if (customerIndex !== -1) {
          this.customers.splice(
            customerIndex,
            1,
            customerData
          );
        }
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async deleteCustomer(customerId: string) {
      try {
        await customerService.destroyCustomer(customerId)
        const customerIndex = this.customers.findIndex(
          (item) => item.id === customerId
        );
        if (customerIndex >= 0) this.customers.splice(customerIndex, 1);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
  }
});