import api from "./api";
import type User from "../types/user";

class AuthService {
  async signUp(data: User): Promise<any> {
    return await api.post("/users/signup", data);
  }

  async signIn(data: User): Promise<any> {
    const response = await api.post("/public/login", data)
    return response.data;
  }

  async refreshtoken(token: User): Promise<any> {
    const response = await api.post("/public/refreshtoken", {
      refreshToken: token,
    });

    return response.data;
  }

  apiClient
}

export default new AuthService();
