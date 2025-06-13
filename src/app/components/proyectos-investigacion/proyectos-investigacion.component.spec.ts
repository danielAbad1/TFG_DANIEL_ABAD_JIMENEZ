import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyectosInvestigacionComponent } from './proyectos-investigacion.component';

describe('ProyectosInvestigacionComponent', () => {
  let component: ProyectosInvestigacionComponent;
  let fixture: ComponentFixture<ProyectosInvestigacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyectosInvestigacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyectosInvestigacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
