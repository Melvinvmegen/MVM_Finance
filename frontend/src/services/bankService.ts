import api from "./api";
import type Bank from "../types/bank";
import { useUserStore } from "../store/userStore"
const userStore = useUserStore()

class BankService {
  getBanks(): Promise<any> {
    return api.get(`/user/${userStore.auth.userId}/banks`);
  }

  createBank(bankData: Bank): Promise<any> {
    return api.post(`/user/${userStore.auth.userId}/banks`, bankData);
  }

  updateBank(bankData: Bank): Promise<any> {
    return api.put(`/user/${userStore.auth.userId}/banks/${bankData.id}`, bankData);
  }

  getBank(bankId: string): Promise<any> {
    return api.get(`/user/${userStore.auth.userId}/banks/${bankId}`);
  }
}

export default new BankService();
