import type Transaction from "./transaction";
export default interface CryptoToken {
  id: null;
  name: string;
  category: string;
  price: number;
  pricePurchase: number;
  priceChange: number;
  profit: number;
  Transactions: Transaction[];
  sold: boolean;
}
