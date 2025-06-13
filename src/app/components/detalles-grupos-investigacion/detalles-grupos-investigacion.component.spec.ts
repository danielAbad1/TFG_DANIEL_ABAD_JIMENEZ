import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesGruposInvestigacionComponent } from './detalles-grupos-investigacion.component';

describe('DetallesGruposInvestigacionComponent', () => {
  let component: DetallesGruposInvestigacionComponent;
  let fixture: ComponentFixture<DetallesGruposInvestigacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesGruposInvestigacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesGruposInvestigacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
