import api from "./api";
import type Revenu from "../types/revenu";

class RevenuService {
  getRevenus(query: any = {}): Promise<any> {
    const queryParams = query;
    return api.get("user/revenus", { params: queryParams });
  }

  updateRevenu(revenuData: Revenu): Promise<any> {
    console.log("revenuData.id", revenuData.id)
    return api.put(`user/revenu/${revenuData.id}`, revenuData);
  }

  getRevenu(revenuId: string): Promise<any> {
    return api.get(`user/revenu/${revenuId}`);
  }

  createRevenu(fileData: File): Promise<any> {
    return api.post(`user/revenu`, fileData);
  }
}

export default new RevenuService();
