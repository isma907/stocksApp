import { E_MARKETS } from '../enum/markets';

export interface WalletData {
  symbol: string;
  market: E_MARKETS;
  stockValue: number;
  precioCompra?: number;
  // fechaCompra?: string;
  difference?: number;
  qty?: number;
  total?: string;
}

export interface Wallet {
  name: string;
  inversiones: WalletData[];
}