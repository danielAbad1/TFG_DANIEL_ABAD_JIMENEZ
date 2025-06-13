import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProyectosInvestigadorComponent } from './proyectos-investigador.component';

describe('ProyectosInvestigadorComponent', () => {
  let component: ProyectosInvestigadorComponent;
  let fixture: ComponentFixture<ProyectosInvestigadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProyectosInvestigadorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProyectosInvestigadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
