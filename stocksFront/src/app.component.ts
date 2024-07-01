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
  AbstractControl,
} from '@angular/forms';
import { debounceTime } from 'rxjs';

export interface StockData {
  symbol: string;
  market: string;
  stockValue: number;
  precioCompra?: number;
  difference?: number;
  qty?: number;
  total?: string;
}

export interface Wallet {
  name: string;
  inversiones: StockData[];
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
  dolarCCL = 0;
  editCCL = false;

  walletForm!: FormGroup;

  ngOnInit() {
    this.stockService.getDolarCCL().subscribe((res) => {
      this.dolarCCL = res as number;
    });

    const oldDataToNewWallets: any = JSON.parse(
      localStorage.getItem('stocksApp') ?? ''
    );

    this.walletForm = this.fb.group({
      wallets: this.fb.array([]),
    });

    oldDataToNewWallets.wallets.forEach((data: Wallet, index: number) => {
      this.addWallet(data.name);
      data.inversiones.forEach((investData) => {
        this.addInvestment(index, investData);
      });
      this.removeInvestment(index, 0);
    });
  }

  get wallets(): FormArray {
    return this.walletForm.get('wallets') as FormArray;
  }

  createWallet(name?: string): FormGroup {
    return this.fb.group({
      name: [name ?? '', Validators.required],
      inversiones: this.fb.array([this.createInvestment()]),
    });
  }

  createInvestment(data?: StockData): FormGroup {
    const group = this.fb.group({
      symbol: data?.symbol ?? '',
      market: data?.market ?? '',
      qty: data?.qty ?? '',
      stockValue: data?.stockValue ?? null,
      precioCompra: data?.precioCompra ?? '',
    });

    group
      .get('symbol')
      ?.valueChanges.pipe(debounceTime(1000))
      .subscribe(() => {
        this.search(group);
      });

    group
      .get('market')
      ?.valueChanges.pipe(debounceTime(1000))
      .subscribe(() => {
        group.controls['precioCompra'].patchValue('');
        this.search(group);
      });

    group
      .get('qty')
      ?.valueChanges.pipe(debounceTime(1000))
      .subscribe(() => {
        this.search(group);
      });

    return group;
  }

  addWallet(name?: string) {
    this.wallets.push(this.createWallet(name ?? ''));
  }

  removeWallet(walletIndex: number) {
    this.wallets.removeAt(walletIndex);
  }

  addInvestment(walletIndex: number, data?: StockData) {
    const inversiones = this.wallets
      .at(walletIndex)
      .get('inversiones') as FormArray;
    inversiones.push(this.createInvestment(data));
  }

  getInvestments(wallet: AbstractControl): FormArray {
    return wallet.get('inversiones') as FormArray;
  }

  removeInvestment(walletIndex: number, investmentIndex: number) {
    const inversiones = this.wallets
      .at(walletIndex)
      .get('inversiones') as FormArray;
    inversiones.removeAt(investmentIndex);
  }

  onDragStart(event: DragEvent, walletIndex: number, investmentIndex: number) {
    event.dataTransfer!.setData(
      'text/plain',
      JSON.stringify({ walletIndex, investmentIndex })
    );
  }

  search(abstract: AbstractControl) {
    const { symbol, market } = abstract.getRawValue();
    if (symbol) {
      this.stockService.getStock(symbol, market).subscribe((res: any) => {
        abstract.patchValue({ stockValue: res });
      });
    }
  }
  //

  getTotalRow(group: AbstractControl) {
    const values = group.getRawValue();
    return values.qty * values.stockValue;
  }

  calcDifference(group: AbstractControl) {
    const data = group.getRawValue();
    if (data.precioCompra) {
      const diferencia = data.stockValue - data.precioCompra;
      const porcentajeDiferencia = (diferencia / data.precioCompra) * 100;
      const value = parseFloat(porcentajeDiferencia.toFixed(2));
      group.patchValue({ difference: value });
      return value;
    }
    return 0;
  }

  //
  onDrop(event: DragEvent, targetWalletIndex: number, targetIndex: number) {
    event.preventDefault();
    const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
    const startIndex = data.investmentIndex;
    const sourceWalletIndex = data.walletIndex;

    const sourceWallet = this.wallets.at(sourceWalletIndex) as FormGroup;
    const targetWallet = this.wallets.at(targetWalletIndex) as FormGroup;

    const sourceInversiones = sourceWallet.get('inversiones') as FormArray;
    const targetInversiones = targetWallet.get('inversiones') as FormArray;

    const movedControl = sourceInversiones.at(startIndex);
    sourceInversiones.removeAt(startIndex);

    // If moving within the same wallet
    if (sourceWallet === targetWallet) {
      targetInversiones.insert(targetIndex, movedControl);
    } else {
      targetInversiones.insert(targetIndex, this.fb.group(movedControl.value));
    }
  }

  saveWallets() {
    localStorage.setItem(
      'stocksApp',
      JSON.stringify(this.walletForm.getRawValue())
    );
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }
}
