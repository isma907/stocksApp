import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StocksService } from './services/stocks.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormArray,
  FormGroup,
} from '@angular/forms';
import { debounceTime, filter, from, map, of, reduce, } from 'rxjs';


export interface StockData {
  symbol: string;
  market: string;
  stockValue: number;
  precioCompra?: number;
  difference?: number;
  qty?: number;
  total?: string;
}

@Component({
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [DecimalPipe],
})
export class AppComponent implements OnInit {
  stockService = inject(StocksService);
  fb = inject(FormBuilder);
  dolarCCL = 0
  editCCL = false;


  defaultVals: StockData[] = [
  ]

  ngOnInit() {
    const localData = localStorage.getItem('stocksApp');
    if (localData) this.defaultVals = JSON.parse(localData) as StockData[]

    this.stockService.getDolarCCL().subscribe((res) => {
      this.dolarCCL = res as number
    })

    if (this.defaultVals) {
      this.defaultVals.forEach((values, index) => {
        this.addNewRow(values)
      });
    }
  }

  form = this.fb.group({
    stocks: this.fb.array([]),
  });

  get stocks(): FormArray {
    return this.form.get('stocks') as FormArray;
  }

  addNewRow(data?: StockData) {
    const group: FormGroup = this.fb.group({
      symbol: this.fb.control(data?.symbol ?? '', Validators.required),
      market: this.fb.control(data?.market ?? '', Validators.required),
      qty: this.fb.control(data?.qty ?? '', Validators.required),
      stockValue: this.fb.control(data?.stockValue ?? '', Validators.required),

      precioCompra: this.fb.control(data?.precioCompra ?? '', Validators.required),
      difference: this.fb.control(data?.difference ?? '', Validators.required),
      total: this.fb.control(data?.total ?? ''),
    });

    group.get('symbol')?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      this.search(group);
    });

    group.get('market')?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      group.controls['precioCompra'].patchValue('')
      this.search(group);
    });

    group.get('qty')?.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      this.search(group);
    });


    setInterval(() => {
      this.search(group)
    }, 5000)


    group.get('stockValue')?.disable();
    this.stocks.push(group);
  }

  search(data: FormGroup) {
    const { symbol, market } = data.getRawValue();
    if (symbol) {
      this.stockService.getStock(symbol, market).subscribe((res: any) => {
        data.patchValue({ stockValue: parseFloat(res.price).toFixed(2) });
      });
    }
  }

  saveLocal() {
    localStorage.setItem('stocksApp', JSON.stringify(this.stocks.getRawValue()))
  }

  getStockTotal(group: any) {
    const values = group.getRawValue();
    const { qty, stockValue } = values;
    if (qty && stockValue) {
      return qty * stockValue;
    }
    return;
  }

  getTotalRetiro(group: any) {
    const values = group.getRawValue();
    const stockTotal = this.getStockTotal(group)
    if (stockTotal) return stockTotal - (stockTotal * 0.01);
    return
  }


  getTotalByMarket$(market: string) {
    return from(this.stocks.getRawValue()).pipe(
      filter((stock: any) => stock.market === market),
      reduce((acc, stock: any) => {
        return acc + (stock.stockValue * stock.qty);
      }, 0)
    );
  }

  getBCBADolares$() {
    return this.getTotalByMarket$('bcba').pipe(
      map((total) =>
        total / this.dolarCCL
      )
    )
  }

  removeRow(index: number) {
    this.stocks.controls.splice(index, 1)
  }



  calcDifference$(index: number) {
    const group = this.stocks.controls[index];
    return of(group.getRawValue()).pipe(
      map(data => {
        if (data.precioCompra) {
          const diferencia = data.stockValue - data.precioCompra;
          const porcentajeDiferencia = (diferencia / data.precioCompra) * 100;
          const value = parseFloat(porcentajeDiferencia.toFixed(2));
          group.patchValue({ 'difference': value });
          return value;
        }
        return
      })
    )
  }



  onDragStart(event: DragEvent, index: number) {
    event.dataTransfer!.setData('text/plain', index.toString());
  }

  onDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();
    const startIndex = parseInt(event.dataTransfer!.getData('text/plain'), 10);
    const movedControl = this.stocks.at(startIndex);
    this.stocks.removeAt(startIndex);
    this.stocks.insert(targetIndex, movedControl);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }


}
