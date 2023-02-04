export default interface Bank {
  id: number;
  name: string;
  amount: number;
  count?: number;
  rows?: Array<Bank>;
}