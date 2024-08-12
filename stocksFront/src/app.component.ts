import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StocksService } from './services/stocks.service';
import { CommonModule, DecimalPipe, JsonPipe } from '@angular/common';
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
import {
  NgbAlertModule,
  NgbDatepickerModule,
  NgbActiveModal,
  NgbModal,
} from '@ng-bootstrap/ng-bootstrap';

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { DeleteWalletModal } from './components/modals/delete-wallet';
import { E_MARKETS } from './enum/markets';
import { InversionResume, Wallet, WalletData } from './interfaces/wallet';

@Component({
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    NgbAlertModule,
    JsonPipe,
    DeleteWalletModal,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
  ],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [DecimalPipe],
})
export class AppComponent implements OnInit {
  stockService = inject(StocksService);
  fb = inject(FormBuilder);
  modalService = inject(NgbModal);
  markets = E_MARKETS;
  stockValueAuto: boolean = true;

  walletForm!: FormGroup;
  dolarCCL = 0;
  editCCL = false;
  ngOnInit() {
    this.stockService.getDolarCCL().subscribe((res) => {
      this.dolarCCL = res as number;
    });

    const oldDataToNewWallets: any = JSON.parse(
      localStorage.getItem('stocksApp') ?? '{}'
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

  createInvestment(data?: WalletData): FormGroup {
    const group = this.fb.group({
      symbol: data?.symbol ?? '',
      market: data?.market ?? '',
      qty: data?.qty ?? '',
      stockValue: data?.stockValue ?? null,
      precioCompra: data?.precioCompra ?? '',
      dolarFecha: data?.dolarFecha ?? null,
      fechaCompra: data?.fechaCompra ?? null,
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

    setInterval(() => {
      const { symbol, market } = group.getRawValue();
      if (symbol && market) {
        this.search(group);
      }
    }, 10000);

    return group;
  }

  addWallet(name?: string) {
    this.wallets.push(this.createWallet(name ?? ''));
  }

  deleteWallet(walletIndex: number) {
    const modalRef = this.modalService.open(DeleteWalletModal, {
      backdrop: true,
    });
    modalRef.componentInstance.wallet =
      this.walletForm.getRawValue().wallets[walletIndex];
    modalRef.componentInstance.confirmed.subscribe(() => {
      this.wallets.removeAt(walletIndex);
    });
  }

  addInvestment(walletIndex: number, data?: WalletData) {
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
        if (this.stockValueAuto) abstract.patchValue({ stockValue: res });
      });
    }
  }
  //

  getGastoRow(group: AbstractControl) {
    const values = group.getRawValue();
    return values.qty * values.precioCompra;
  }

  getTotalRow(group: AbstractControl) {
    const values = group.getRawValue();
    return values.qty * values.stockValue;
  }

  getTotalByMarket(group: AbstractControl, market?: string) {
    const values = group.getRawValue();
    const sumWithInitial = (values.inversiones as WalletData[]).reduce(
      (accumulator, data) => {
        const marketFilter = market;
        if (data.qty && data.stockValue && data.market === market)
          return accumulator + data.qty * data.stockValue;
        return accumulator + 0;
      },
      0
    );
    return sumWithInitial;
  }

  getAllWalletsTotalByMarket(market: E_MARKETS) {
    const values = this.walletForm.getRawValue();
    const total = values.wallets.reduce((accumulator: number, wallet: any) => {
      wallet.inversiones.forEach((data: WalletData) => {
        if (data.qty && data.stockValue && data.market === market) {
          accumulator += data.qty * data.stockValue;
        }
      });
      return accumulator;
    }, 0);

    return total;
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

  totalPorAccion() {
    const wallets = this.wallets.getRawValue() as Wallet[];
    const data: InversionResume = {};

    wallets.forEach((wallet) => {
      wallet.inversiones.forEach((inversion) => {
        const { symbol, qty, market, stockValue, precioCompra } = inversion;
        const objKey = `${symbol}_${market}`;

        if (data[objKey] === undefined) {
          data[objKey] = {
            qty: 0,
            invertido: 0,
            total: 0,
          };
        }
        if (qty && stockValue) {
          data[objKey]['qty'] += qty;
          data[objKey]['invertido'] += qty * (precioCompra ?? 0);
          data[objKey]['total'] += qty * stockValue;
        }
      });
    });

    return data;
  }

  perdidaGananciaEnDinero(group: AbstractControl): number {
    const data = group.getRawValue();
    const diferencia = data.stockValue - data.precioCompra;
    const porcentajeDiferencia = (diferencia / data.precioCompra) * 100;
    const porcentaje = parseFloat(porcentajeDiferencia.toFixed(2));
    const totalInvertido = data.precioCompra * data.qty;
    const valorFinal = totalInvertido * (1 + porcentaje / 100);

    const diferenciaTotal = valorFinal - totalInvertido;

    return diferenciaTotal;
  }

  get getTotalDolares() {
    const totalCarterasBCBA = this.getAllWalletsTotalByMarket(
      this.markets.BCBA
    );
    const ccl = this.dolarCCL;
    if (totalCarterasBCBA && ccl) {
      return totalCarterasBCBA / ccl;
    }
    return;
  }

  get TotalDolaresFechaCompra() {
    const values = this.walletForm.getRawValue();
    const total = values.wallets.reduce((accumulator: number, wallet: any) => {
      wallet.inversiones.forEach((data: WalletData) => {
        if (
          data.qty &&
          data.precioCompra &&
          data.market === E_MARKETS.BCBA &&
          data.dolarFecha
        ) {
          accumulator += (data.qty * data.precioCompra) / data.dolarFecha;
        }
      });
      return accumulator;
    }, 0);

    return total;
  }

  totalDolarFecha(group: AbstractControl | WalletData): number {
    let qty;
    let precioCompra;
    let dolarFecha;

    if (group instanceof AbstractControl) {
      const formVal = group.getRawValue();
      qty = formVal.qty;
      precioCompra = formVal.precioCompra;
      dolarFecha = formVal.dolarFecha;
    } else {
      qty = group.qty;
      precioCompra = group.precioCompra;
      dolarFecha = group.dolarFecha;
    }

    const total = precioCompra * qty;
    return total / dolarFecha;
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
