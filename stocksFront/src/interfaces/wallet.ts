import { E_MARKETS } from '../enum/markets';

export interface WalletData {
  symbol: string;
  market: E_MARKETS;
  stockValue: number;
  precioCompra?: number;
  dolarFecha?: number;
  fechaCompra?: string;
  difference?: number;
  qty?: number;
  total?: string;
}

export interface Wallet {
  name: string;
  inversiones: WalletData[];
}

export interface InversionResume {
  [val: string]: {
    qty: number;
    total: number;
    invertido: number;
  };
}
