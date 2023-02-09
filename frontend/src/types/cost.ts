export default interface Cost {
  id: number;
  createdAt: Date;
  name: string;
  category:string;
  total: number;
  tvaAmount: number;
  recurrent: boolean;
  count?: number;
  rows?: Array<Cost>;
  _destroy?: boolean;
}
