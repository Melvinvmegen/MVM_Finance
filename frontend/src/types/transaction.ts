export default interface Transaction {
  id: string;
  buyingDate: Date;
  exchange: string;
  price: number;
  quantity: number;
  priceChange: number;
  fees: number;
  total: number;
  CryptoId: string | number | undefined;
  _destroy?: boolean;
}
