import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesProyectosInvestigacionComponent } from './detalles-proyectos-investigacion.component';

describe('DetallesProyectosInvestigacionComponent', () => {
  let component: DetallesProyectosInvestigacionComponent;
  let fixture: ComponentFixture<DetallesProyectosInvestigacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesProyectosInvestigacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesProyectosInvestigacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
