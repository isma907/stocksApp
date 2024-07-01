import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StocksService {
  constructor(private http: HttpClient) {}

  getDolarCCL() {
    return this.http.get<number>(`http://localhost:3000/dolar/getCCL`);
  }

  getStock(symbol: string, market: string) {
    return this.http
      .get<number>(
        `http://localhost:3000/stocks/getStockLastValue?symbol=${symbol}&market=${market}`
      )
      .pipe(map((res: any) => parseFloat(res.price).toFixed(2)));
  }
}
