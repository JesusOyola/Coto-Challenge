import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { CocktailSearchComponent } from './cocktail-search.component';

describe('CocktailSearchComponent', () => {
  let component: CocktailSearchComponent;
  let fixture: ComponentFixture<CocktailSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CocktailSearchComponent, 
        ReactiveFormsModule,
        NoopAnimationsModule, 
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CocktailSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  
  describe('Form Initialization', () => {
    it('should initialize the form with default values', () => {
      expect(component.searchForm).toBeDefined();
      // USO DEL OPERADOR '!' (No-null Assertion) para evitar el error TS(2531)
      expect(component.searchForm.get('searchType')!.value).toBe('name');
      expect(component.searchForm.get('searchTerm')!.value).toBe('');
    });

    it('should initialize searchType signal to "name"', () => {
      expect(component.searchType()).toBe('name');
    });

    it('should initialize searchTerm with required validator', () => {
      const termControl = component.searchForm.controls.searchTerm;
      termControl.setValue('');
      expect(termControl.valid).toBeFalse();
      expect(termControl.hasError('required')).toBeTrue();
    });
  });

  
  describe('Validator Logic', () => {
    const termControl = () => component.searchForm.controls.searchTerm;

    it('should apply ID validators when searchType changes to "id"', () => {
      component.searchForm.controls.searchType.setValue('id');

      // Prueba de validación numérica
      termControl().setValue('123');
      expect(termControl().valid).toBeTrue();
      termControl().setValue('abc');
      expect(termControl().hasError('pattern')).toBeTrue();
    });

    it('should apply Name/Ingredient validators when searchType changes to "name" or "ingredient"', () => {
      // Caso 'name'
      component.searchForm.controls.searchType.setValue('name');

      // Prueba de validación alfabética
      termControl().setValue('Vodka');
      expect(termControl().valid).toBeTrue();
      termControl().setValue('Vodka123'); // Falla por números
      expect(termControl().hasError('pattern')).toBeTrue();

      // Prueba de longitud máxima (50)
      termControl().setValue('a'.repeat(51));
      expect(termControl().hasError('maxlength')).toBeTrue();
    });

    it('should clear the searchTerm value when searchType changes', () => {
      const initialValue = 'some text';
      termControl().setValue(initialValue);
      fixture.detectChanges();

      // Cambiar el tipo de búsqueda
      component.searchForm.controls.searchType.setValue('id');
      expect(termControl().value).toBe('');

      // Cambiar de nuevo
      termControl().setValue(initialValue);
      component.searchForm.controls.searchType.setValue('name');
      expect(termControl().value).toBe('');
    });
  });

  
  describe('Form Submission', () => {
    it('should emit searchEvent when form is valid', () => {
      spyOn(component.searchEvent, 'emit');

      // Establecer valores válidos para 'name'
      component.searchForm.controls.searchType.setValue('name');
      component.searchForm.controls.searchTerm.setValue('Margarita');

      component.onSubmit();

      expect(component.searchEvent.emit).toHaveBeenCalledWith({
        type: 'name',
        value: 'Margarita',
      });
    });

    it('should emit searchEvent with trimmed value', () => {
      spyOn(component.searchEvent, 'emit');

      component.searchForm.controls.searchType.setValue('ingredient');
      component.searchForm.controls.searchTerm.setValue(' Gin '); // Con espacios

      component.onSubmit();

      expect(component.searchEvent.emit).toHaveBeenCalledWith({
        type: 'ingredient',
        value: 'Gin', 
      });
    });

    it('should NOT emit searchEvent when form is invalid', () => {
      spyOn(component.searchEvent, 'emit');

     
      component.searchForm.controls.searchType.setValue('name');
      component.searchForm.controls.searchTerm.setValue('');

      component.onSubmit();

      expect(component.searchEvent.emit).not.toHaveBeenCalled();
    });
  });

 
  describe('Error Messages', () => {
    const termControl = () => component.searchForm.controls.searchTerm;

    it('should return "Este campo es obligatorio" for required error', () => {
      termControl().setValue('');
      expect(component.getErrorMessage()).toBe('Este campo es obligatorio');
    });

    it('should return numeric pattern error for ID search', () => {
      component.searchForm.controls.searchType.setValue('id');
      termControl().setValue('a');
      expect(component.getErrorMessage()).toBe('Solo se permiten caracteres numéricos.');
    });

    it('should return alphanumeric pattern error for Name search', () => {
      component.searchForm.controls.searchType.setValue('name');
      termControl().setValue('123');
      expect(component.getErrorMessage()).toBe('Solo se permiten caracteres alfabéticos.');
    });

    it('should return maxlength error', () => {
      component.searchForm.controls.searchType.setValue('name');
      termControl().setValue('a'.repeat(51));
      
      spyOn(termControl(), 'hasError').and.callFake((errorName: string) => {
        if (errorName === 'maxlength') return true;
        return false;
      });
      
      spyOn(termControl(), 'getError').and.returnValue({ requiredLength: 50 });

      expect(component.getErrorMessage()).toBe('Máximo 50 caracteres.');
    });
  });

  // --- 5. Lógica de Tipo de Input ---
  describe('getInputType', () => {
    it('should return "number" when searchType is "id"', () => {
      component.searchType.set('id');
      expect(component.getInputType()).toBe('number');
    });

    it('should return "text" when searchType is "name"', () => {
      component.searchType.set('name');
      expect(component.getInputType()).toBe('text');
    });

    it('should return "text" when searchType is "ingredient"', () => {
      component.searchType.set('ingredient');
      expect(component.getInputType()).toBe('text');
    });
  });
});
