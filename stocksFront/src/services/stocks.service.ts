import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StocksService {
  constructor(private http: HttpClient) { }


  getDolarCCL() {
    return this.http.get(
      `http://localhost:3000/dolar/getCCL`
    );
  }

  getStock(symbol: string, market: string) {
    return this.http.get(
      `http://localhost:3000/stocks/getStockLastValue?symbol=${symbol}&market=${market}`
    );
  }
}
