import api from "./api";
import type Crypto from "../types/crypto";
import { useUserStore } from "../store/userStore"
const userStore = useUserStore()

class CryptoService {
  getCryptos(): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/cryptos`);
  }

  createCrypto(cryptoData: Crypto): Promise<any> {
    return api.post(`user/${userStore.auth.userId}/cryptos`, cryptoData);
  }

  updateCrypto(cryptoData: Crypto): Promise<any> {
    return api.put(`user/${userStore.auth.userId}/cryptos/${cryptoData.id}`, cryptoData);
  }

  updateCryptos(): Promise<any> {
    return api.get(`user/${userStore.auth.userId}/cryptos/update_cryptos`);
  }
}

export default new CryptoService();
