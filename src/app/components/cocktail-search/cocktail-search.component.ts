import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
@Component({
  selector: 'app-cocktail-search',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  templateUrl: './cocktail-search.component.html',
  styleUrl: './cocktail-search.component.scss',
})
export class CocktailSearchComponent {
  @Output() searchEvent = new EventEmitter<{ type: 'name' | 'ingredient' | 'id'; value: string }>();

  public searchType = signal<'name' | 'ingredient' | 'id'>('name');

  public searchForm = new FormGroup({
    searchType: new FormControl<'name' | 'ingredient' | 'id'>('name', { nonNullable: true }),
    searchTerm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    // Sincronizar el signal local con el valor del formulario
    this.searchForm.controls.searchType.valueChanges.subscribe((type) => {
      this.searchType.set(type);
      this.updateValidators(type);
    });

    this.searchForm.controls.searchTerm.valueChanges.subscribe(() => {
      if (this.searchForm.valid) {
        this.onSubmit();
      }
    });
  }

  // Define el tipo de input basado en el control
  getInputType(): 'text' | 'number' {
    return this.searchType() === 'id' ? 'number' : 'text';
  }

  // Actualiza los Validators según el tipo de búsqueda
  private updateValidators(type: 'name' | 'ingredient' | 'id'): void {
    const termControl = this.searchForm.controls.searchTerm;
    termControl.clearValidators();

    if (type === 'id') {
      // ID: solo numérico
      termControl.setValidators([Validators.required, Validators.pattern(/^[0-9]+$/)]);
    } else if (type === 'name' || type === 'ingredient') {
      // Nombre/Ingrediente: solo alfabético, máx 50 caracteres
      termControl.setValidators([
        Validators.required,
        Validators.pattern(/^[a-zA-Z\s]*$/), // Acepta solo letras y espacios
        Validators.maxLength(50),
      ]);
    }

    termControl.updateValueAndValidity();

    termControl.setValue('');
  }

  onSubmit(): void {
    if (this.searchForm.valid) {
      const { searchType, searchTerm } = this.searchForm.getRawValue();
      this.searchEvent.emit({
        type: searchType,
        value: searchTerm.trim(),
      });
    }
  }

  // Mensaje de error dinámico
  getErrorMessage(): string {
    const termControl = this.searchForm.controls.searchTerm;
    if (termControl.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (termControl.hasError('pattern')) {
      return this.searchType() === 'id'
        ? 'Solo se permiten caracteres numéricos.'
        : 'Solo se permiten caracteres alfabéticos.';
    }
    if (termControl.hasError('maxlength')) {
      return `Máximo ${termControl.getError('maxlength').requiredLength} caracteres.`;
    }
    return '';
  }
}
