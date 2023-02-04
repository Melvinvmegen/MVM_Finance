import api from "./api";
import type Revenu from "../types/revenu";
import { useUserStore } from "../store/userStore";
const userStore = useUserStore();

class RevenuService {
  getRevenus(bankId: string, query: any = {}): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/banks/${bankId}/revenus/`, { params: query });
  }

  updateRevenu(revenuData: Revenu): Promise<any> {
    return api.put(`user/${userStore.auth.userId}/banks/${revenuData.BankId}/revenus/${revenuData.id}`, revenuData);
  }

  getRevenu(bankId: string, revenuId: string): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/banks/${bankId}/revenus/${revenuId}`);
  }

  createRevenu(bankId: string, fileData: File): Promise<any> {
    return api.post(`user/${userStore.auth.userId}/banks/${bankId}/revenus`, fileData);
  }
}

export default new RevenuService();
