import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesPublicacionComponent } from './detalles-publicacion.component';

describe('DetallesPublicacionComponent', () => {
  let component: DetallesPublicacionComponent;
  let fixture: ComponentFixture<DetallesPublicacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesPublicacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesPublicacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
