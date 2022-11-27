export default interface Cost {
  id: number;
  createdAt: Date;
  name: string;
  total: number;
  tvaAmount: number;
  count?: number;
  rows?: Array<Cost>;
  _destroy?: boolean;
}
