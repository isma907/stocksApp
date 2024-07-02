import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Wallet } from 'stocksFront/src/interfaces/wallet';

@Component({
  selector: 'delete-wallet-modal',
  standalone: true,
  template: `
    <div class="modal-header">
      <h4 class="modal-title">Eliminar Wallet: {{ wallet.name }}</h4>
      <button
        type="button"
        class="btn-close"
        aria-label="Close"
        (click)="activeModal.dismiss('Cross click')"
      ></button>
    </div>
    <div class="modal-body">
      <p>Estas seguro de eliminar esta wallet?</p>
    </div>
    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="activeModal.dismiss('Cancel click')"
      >
        Cancelar
      </button>
      <button type="button" class="btn btn-danger" (click)="confirm()">
        Eliminar
      </button>
    </div>
  `,
})
export class DeleteWalletModal {
  modal = inject(NgbActiveModal);
  @Input('wallet') wallet!: Wallet;
  @Output() confirmed = new EventEmitter<void>();
  constructor(public activeModal: NgbActiveModal) {}

  confirm() {
    this.confirmed.emit();
    this.activeModal.close('Confirm click');
  }
}
