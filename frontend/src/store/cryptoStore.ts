import { defineStore } from "pinia";
import cryptoService from "../services/cryptoService";
import type Crypto from "../types/crypto";
import { useIndexStore } from "./indexStore"
const indexStore = useIndexStore()

export const useCryptoStore = defineStore("cryptoStore", {
  state: () => ({
    cryptos: [] as Crypto[],
  }),
  actions: {
    async getCryptos() {
      const { data } = await cryptoService.getCryptos();
      this.setCryptos(data);
      return this.cryptos;
    },
    async createCrypto(cryptoData: Crypto) {
      try {
        const res = await cryptoService.createCrypto(cryptoData);
        this.cryptos.unshift(cryptoData); 
        return res.data.crypto;
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    async updateCrypto(cryptoData: Crypto) {
      console.log("cryptoData", cryptoData)
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
    async swapCrypto(cryptoData: Crypto) {
      try {
        await cryptoService.swapCrypto(cryptoData);
        this.updateStore(cryptoData);
      } catch (error) {
        if (error) indexStore.setError(error);
      }
    },
    setCryptos(cryptos : Crypto[]) {
      this.cryptos = [ ...cryptos ];
    },
    updateStore(cryptoData) {
      const cryptoIndex = this.cryptos.findIndex(
        (item) => item.id === cryptoData.id
      );
      if (cryptoIndex !== -1) {
        this.cryptos.splice(
          cryptoIndex,
          1,
          cryptoData
        );
      }
    }
  }
});