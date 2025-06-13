import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndiceHInvestigadoresComponent } from './indice-h-investigadores.component';

describe('IndiceHInvestigadoresComponent', () => {
  let component: IndiceHInvestigadoresComponent;
  let fixture: ComponentFixture<IndiceHInvestigadoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IndiceHInvestigadoresComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndiceHInvestigadoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
