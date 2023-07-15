import { defineStore } from "pinia";
import cryptoService from "../services/cryptoService";
import type { CryptoCurrencies } from "../../types/models";
import { useIndexStore } from "./indexStore";
const indexStore = useIndexStore();

export const useCryptoStore = defineStore("cryptoStore", {
  state: () => ({
    cryptos: [] as CryptoCurrencies[],
  }),
  actions: {
    async getCryptos() {
      const { data } = await cryptoService.getCryptos();
      this.setCryptos(data);
      return this.cryptos;
    },
    async createCrypto(cryptoData: CryptoCurrencies) {
      try {
        const res = await cryptoService.createCrypto(cryptoData);
        this.cryptos.unshift(cryptoData);
        return res.data.crypto;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateCrypto(cryptoData: CryptoCurrencies) {
      try {
        await cryptoService.updateCrypto(cryptoData);
        this.updateStore(cryptoData);
        return cryptoData;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateCryptos() {
      const { data } = await cryptoService.updateCryptos();

      try {
        this.setCryptos(data.updateCryptos);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async swapCrypto(cryptoData: CryptoCurrencies) {
      try {
        await cryptoService.swapCrypto(cryptoData);
        this.updateStore(cryptoData);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    setCryptos(cryptos: CryptoCurrencies[]) {
      this.cryptos = [...cryptos];
    },
    updateStore(cryptoData) {
      const cryptoIndex = this.cryptos.findIndex((item) => item.id === cryptoData.id);
      if (cryptoIndex !== -1) {
        this.cryptos.splice(cryptoIndex, 1, cryptoData);
      }
    },
  },
});
