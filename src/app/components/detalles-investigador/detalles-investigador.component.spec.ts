import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetallesInvestigadorComponent } from './detalles-investigador.component';

describe('DetallesInvestigadorComponent', () => {
  let component: DetallesInvestigadorComponent;
  let fixture: ComponentFixture<DetallesInvestigadorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallesInvestigadorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetallesInvestigadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
