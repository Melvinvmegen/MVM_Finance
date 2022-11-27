export default interface Credit {
  id: null;
  createdAt: Date;
  creditor: string;
  reason: string;
  total: number;
  count?: number;
  rows?: Array<Credit>;
  _destroy?: boolean;
}
