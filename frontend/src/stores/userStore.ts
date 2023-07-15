import { defineStore } from "pinia";
import AuthService from "../services/authService";
import TokenService from "../services/tokenService";
import type { Users } from "../../types/models";
import api from "../services/api";
import { useIndexStore } from "./indexStore";

export const useUserStore = defineStore("userStore", {
  state: () => ({
    auth: TokenService.getUser(),
  }),
  actions: {
    async signIn(payload) {
      let auth;

      if (payload && payload.token) {
        auth = payload;
      } else {
        // Load auth if not passed in params
        if (this.auth) {
          auth = this.auth;
        }
      }

      // Calculate expires_date if not set
      if (auth && !auth.expires_date) {
        auth.expires_date = new Date().getTime() + (auth.expires_in || 14400) * 1000;
      }

      // Check validity of auth token
      if (!TokenService.getLocalRefreshToken() && (!auth || auth.expires_date < new Date().getTime() + 60000)) {
        this.logout();
        return null;
      }

      if (TokenService.getLocalRefreshToken() && (!auth || auth.expires_date < new Date().getTime() + 60000)) {
        this.refreshToken();
        auth.expires_date = new Date().getTime() + (auth.expires_in || 14400) * 1000;
      }

      // Don't load user from server if already loaded and auth still valid
      if (this.auth === auth && this.auth?.token) {
        return this.auth;
      }

      // Load user from server
      this.auth = { ...this.auth, ...auth };
      api.defaults.headers.common = api.defaults.headers.common || {};
      api.defaults.headers.common["Authorization"] = `Bearer ${auth.token}`;
      TokenService.setUser(auth);
      return auth;
    },

    logout() {
      if (api.defaults.headers.common) delete api.defaults.headers.common["Authorization"];
      TokenService.removeUser();
      return (this.auth = null);
    },

    signUp(user: Users) {
      const indexStore = useIndexStore();
      return AuthService.signUp(user).then(
        (response) => {
          this.auth = user;
          return Promise.resolve(response.data);
        },
        (error) => {
          if (error) indexStore.setError(error);
          return Promise.reject(error);
        },
      );
    },
    async refreshToken() {
      if (!this.auth) return;
      const data = await AuthService.refreshtoken(TokenService.getLocalRefreshToken());
      const { token } = data;
      this.auth = { ...this.auth, token };
      TokenService.updateLocalToken(token);
    },
  },
});
