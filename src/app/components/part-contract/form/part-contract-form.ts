import {Component, computed, inject, OnInit, Signal, signal, WritableSignal} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {MessageService} from 'primeng/api';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {MessageModule} from 'primeng/message';
import {ToastModule} from 'primeng/toast';
import {CheckboxModule} from 'primeng/checkbox';
import {DividerModule} from 'primeng/divider';
import {DatePickerModule} from 'primeng/datepicker';
import {TagModule} from 'primeng/tag';
import {FIELD_LABELS} from '../../../enums/part-fields';
import {PartContractService} from '../../../services/part-contract.service';
import {SubjectLookupDto} from '../../../dtos/arco-management/subject-lookup-dto';

@Component({
  selector: 'app-part-contract-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, RouterModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, TextareaModule,
    MessageModule, ToastModule, CheckboxModule, DividerModule,
    DatePickerModule, TagModule
  ],
  providers: [MessageService],
  templateUrl: './part-contract-form.html'
})
export class PartContractForm implements OnInit {

  form!: FormGroup;
  saving: WritableSignal<boolean> = signal(false);
  error: WritableSignal<string> = signal('');
  fieldLabels: Record<string, string> = FIELD_LABELS;
  availableFields: string[] = Object.keys(FIELD_LABELS);
  selectedFields: WritableSignal<string[]> = signal<string[]>([]);
  hasNoFields: Signal<boolean> = computed(() => this.selectedFields().length === 0);

  searchId: WritableSignal<string> = signal('');
  searching: WritableSignal<boolean> = signal(false);
  searchError: WritableSignal<string> = signal('');
  foundSubject: WritableSignal<SubjectLookupDto | null> = signal<SubjectLookupDto | null>(null);

  fb:FormBuilder = inject(FormBuilder);
  svc:PartContractService = inject(PartContractService);
  router:Router = inject(Router);
  messageService:MessageService = inject(MessageService);

  ngOnInit() {
    const today = new Date();
    const oneYear = new Date(Date.now() + 15 * 86400000);
    this.form = this.fb.group({
      companyName: ['', [Validators.required, Validators.minLength(3)]],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPerson: [''],
      purposeDescription: ['', [Validators.required, Validators.minLength(10)]],
      validFrom: [today, Validators.required],
      validUntil: [oneYear, Validators.required]
    });
  }

  lookupSubject() {
    const id = this.searchId().trim();
    if (!id) {return;}
    this.searching.set(true);
    this.searchError.set('');
    this.foundSubject.set(null);
    this.svc.lookupSubject(id).subscribe({
      next: subject => {
        this.foundSubject.set(subject);
        this.searching.set(false);
      },
      error: err => {
        this.searchError.set(err.status === 404 ? 'Titular no encontrado.' : 'Error al buscar.');
        this.searching.set(false);
      }
    });
  }

  clearSubject() {
    this.foundSubject.set(null);
    this.searchId.set('');
    this.searchError.set('');
  }

  isFieldSelected(field: string): boolean {
    return this.selectedFields().includes(field);
  }

  toggleField(field: string, checked: boolean) {
    if (checked) {
      this.selectedFields.update(fields => [...fields, field]);
    } else {
      this.selectedFields.update(fields =>
        fields.filter(f => f !== field)
      );
    }
  }

  submit() {
    if (this.form.invalid || this.hasNoFields() || !this.foundSubject()) {
      this.form.markAllAsTouched();
      this.error.set('Completa todos los campos, selecciona un titular y al menos un campo de datos.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const v = this.form.value;
    this.svc.create({
      subjectId: this.foundSubject()!.id,
      companyName: v.companyName,
      contactEmail: v.contactEmail,
      contactPerson: v.contactPerson || null,
      purposeDescription: v.purposeDescription,
      allowedFields: this.selectedFields(),
      validFrom: (v.validFrom as Date).toISOString(),
      validUntil: (v.validUntil as Date).toISOString()
    }).subscribe({
      next: c => {
        this.messageService.add({
          severity: 'success',
          summary: 'Contrato creado',
          detail: `Contrato para ${c.companyName} creado. Se enviaron credenciales al correo.`
        });
        setTimeout(() => this.router.navigate(['/part-contracts', c.id]), 1200);
      },
      error: err => {
        this.error.set(err.error?.detail ?? 'Error al crear el contrato.');
        this.saving.set(false);
      }
    });
  }
}
