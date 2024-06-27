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
} from '@angular/forms';

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

  async ngOnInit(): Promise<void> {
    this.addNewRow();
  }

  form = this.fb.group({
    stocks: this.fb.array([]),
  });

  get stocks(): FormArray {
    return this.form.get('stocks') as FormArray;
  }

  addNewRow() {
    const group = this.fb.group({
      symbol: this.fb.control('', Validators.required),
      market: this.fb.control('', Validators.required),
      stockValue: this.fb.control('', Validators.required),
      qty: this.fb.control('', Validators.required),
      total: this.fb.control(''),
    });

    group.get('stockValue')?.disable();

    this.stocks.push(group);
  }

  search(index: number) {
    const group = this.stocks.controls[index];
    const price = group.get('stockValue');
    const { symbol, market } = group.value;
    this.stockService.getStock(symbol, market).subscribe((data: any) => {
      price?.patchValue(parseFloat(data.price));
    });
  }

  getTotal(index: number) {
    const group = this.stocks.controls[index];
    const values = group.getRawValue();
    const { qty, stockValue } = values;

    if (qty && stockValue) {
      return qty * stockValue;
    }
    return;
  }
}
