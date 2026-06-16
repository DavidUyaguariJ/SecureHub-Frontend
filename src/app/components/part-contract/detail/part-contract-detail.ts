import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {FormsModule} from "@angular/forms";
import {PartContractDto} from '../../../dtos/part-management/part-contract-dto';
import {BlockchainStatus} from '../../../dtos/part-management/blockchain-status';
import {FIELD_LABELS} from '../../../enums/part-fields';
import {PartContractService} from '../../../services/part-contract.service';
import {Toast} from 'primeng/toast';
import {Button} from 'primeng/button';
import {Card} from 'primeng/card';
import {ProgressSpinner} from 'primeng/progressspinner';
import {Message} from 'primeng/message';
import {Tag} from 'primeng/tag';
import {Dialog} from 'primeng/dialog';
import {Textarea} from 'primeng/textarea';
import {catchError, Observable, of} from 'rxjs';
import {PrimeTemplate} from 'primeng/api';

@Component({
  selector: 'app-part-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Toast, Button, Card, ProgressSpinner, Message, Tag, Dialog, Textarea, PrimeTemplate],
  templateUrl: './part-contract-detail.html'
})
export class PartContractDetail implements OnInit {
  contract?: PartContractDto;
  blockchain?: BlockchainStatus;
  loading    = false;
  revokeMode = false;
  revokeReason = '';
  revoking   = false;
  error      = '';
  fieldLabels  = FIELD_LABELS;
  bcStatusLabels: string[] = ['ACTIVO', 'SUSPENDIDO', 'REVOCADO'];

  route = inject(ActivatedRoute);
  router = inject(Router);
  cdr = inject(ChangeDetectorRef);
  svc   = inject(PartContractService);

  get id(): string {
    return this.route.snapshot.paramMap.get('id')!;
  }

  ngOnInit():void {
    this.loading = true;
    this.svc.getById(this.id).subscribe({
      next: contract => {
        this.contract = contract;
        this.loading  = false;
        this.cdr.detectChanges();
        this.svc.getBlockchainStatus(this.id).pipe(
          catchError((): Observable<BlockchainStatus> =>
            of({ active: false, validUntil: null, status: 0 } as BlockchainStatus))
        ).subscribe(bc => {
          this.blockchain = bc;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.loading = false;
        this.error   = 'Contrato no encontrado.';
        this.cdr.detectChanges();
      }
    });
  }

  revoke():void {
    if (!this.contract || !this.revokeReason.trim()) {return;}
    this.revoking = true;
    this.svc.revoke(this.contract.id, { reason: this.revokeReason }).subscribe({
      next: updated => {
        this.contract    = updated;
        this.revokeMode  = false;
        this.revoking    = false;
        this.ngOnInit();
      },
      error: () => {
        this.revoking = false;
        this.error    = 'Error al revocar.';
      }
    });
  }

  downloadPdf():void {
    if (!this.contract) {return;}
    this.svc.downloadPdf(this.contract.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `contrato-${this.contract!.companyName.replace(/ /g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  statusSeverity(status: string): 'success' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'ACTIVO':     return 'success';
      case 'SUSPENDIDO': return 'warn';
      case 'REVOCADO':   return 'danger';
      case 'VENCIDO':    return 'secondary';
      default:           return 'secondary';
    }
  }
}
