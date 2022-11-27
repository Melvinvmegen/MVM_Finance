import type User from "../types/user";

class TokenService {
  getLocalRefreshToken() {
    const user: any = this.getUser();
    return user?.refresh_token;
  }

  getLocalToken() {
    const user: any = this.getUser();
    return user?.token;
  }

  updateLocalToken(token: string) {
    const user: any = this.getUser();
    user.token = token;
    this.setUser(user);
  }

  getUser() {
    const user = JSON.parse(localStorage.getItem("auth") || "null");
    return user;
  }

  setUser(user: User) {
    localStorage.setItem("auth", JSON.stringify(user));
  }

  removeUser() {
    localStorage.removeItem("auth");
  }
}

export default new TokenService();
