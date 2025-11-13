import {
  Component,
  Input,
  inject,
  ViewContainerRef,
  ElementRef,
  TemplateRef,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule, Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';

import { Drink } from '../../models/cocktail.interface';
import { CocktailStore } from '../../store/cocktail.store';

@Component({
  selector: 'app-cocktail-card',
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, OverlayModule],
  templateUrl: './cocktail-card.component.html',
  styleUrl: './cocktail-card.component.scss',
})
export class CocktailCardComponent {
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private elementRef = inject(ElementRef);
  private store = inject(CocktailStore);
  private overlayRef: OverlayRef | null = null;
  @Input({ required: true }) cocktail!: Drink;

  // Signal computada para saber si es favorito
  public isFavorite = computed(() => this.store.isFavorite()(this.cocktail.idDrink));

  toggleFavorite(): void {
    this.store.toggleFavorite(this.cocktail);
    this.closeMenu();
  }

  openMenu(event: MouseEvent, menuTemplate: TemplateRef<unknown>): void {
    event.preventDefault();

    if (this.overlayRef && this.overlayRef.hasAttached()) {
      this.closeMenu();
      return;
    }

    
    this.overlayRef = this._createOverlayRef();

    //  Adjunta el menú y configura el cierre
    this.overlayRef.attach(new TemplatePortal(menuTemplate, this.viewContainerRef));
    this.overlayRef.backdropClick().subscribe(() => this.closeMenu());
  }

  // Crea y configura el OverlayRef
  private _createOverlayRef(): OverlayRef {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.elementRef)
      .withPositions([
        {
          originX: 'end',
          originY: 'bottom',
          overlayX: 'end',
          overlayY: 'top',
          offsetY: 8,
        },
      ]);

    return this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
  }

  closeMenu(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}
