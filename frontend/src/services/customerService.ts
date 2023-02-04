import api from "./api";
import type Customer from "../types/customer";
import { useUserStore } from "../store/userStore"
const userStore = useUserStore()

class CustomerService {
  getCustomers(query: any): Promise<any> {
    return api.get(`/user/${userStore.auth.userId}/customers`, { params: query });
  }

  createCustomer(customerData: Customer): Promise<any> {
    return api.post(`/user/${userStore.auth.userId}/customers`, customerData);
  }

  updateCustomer(customerData: Customer): Promise<any> {
    return api.put(`/user/${userStore.auth.userId}/customers/${customerData.id}`, customerData);
  }

  getCustomer(customerId: string): Promise<any> {
    return api.get(`/user/${userStore.auth.userId}/customers/${customerId}`);
  }

  destroyCustomer(customerId: string): Promise<any> {
    return api.delete(`/user/${userStore.auth.userId}/customers/${customerId}`);
  }
}

export default new CustomerService();
