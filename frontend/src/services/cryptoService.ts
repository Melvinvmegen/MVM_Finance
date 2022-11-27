import api from "./api";
import type Crypto from "../types/crypto";

class CryptoService {
  getCryptos(): Promise<any> {
    return api.get("user/cryptos");
  }

  createCrypto(cryptoData: Crypto): Promise<any> {
    return api.post("user/crypto", cryptoData);
  }

  updateCrypto(cryptoData: Crypto): Promise<any> {
    return api.put(`user/crypto/${cryptoData.id}`, cryptoData);
  }

  swapCrypto(cryptoData: Crypto): Promise<any> {
    return api.put(`user/swap_crypto/${cryptoData.id}`, cryptoData);
  }

  updateCryptos(): Promise<any> {
    return api.get("user/update_cryptos");
  }
}

export default new CryptoService();
