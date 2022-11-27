import api from "./api";
import type Customer from "../types/customer";

class CustomerService {
  getCustomers(query: any): Promise<any> {
    return api.get("/user/customers", { params: query });
  }

  createCustomer(customerData: Customer): Promise<any> {
    return api.post("/user/customer", customerData);
  }

  updateCustomer(customerData: Customer): Promise<any> {
    return api.put(`/user/customer/${customerData.id}`, customerData);
  }

  getCustomer(customerId: string): Promise<any> {
    return api.get(`/user/customer/${customerId}`);
  }

  destroyCustomer(customerId: string): Promise<any> {
    return api.delete(`/user/customer/${customerId}`);
  }
}

export default new CustomerService();
