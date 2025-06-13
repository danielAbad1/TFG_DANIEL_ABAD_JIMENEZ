import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GruposInvestigacionComponent } from './grupos-investigacion.component';

describe('GruposInvestigacionComponent', () => {
  let component: GruposInvestigacionComponent;
  let fixture: ComponentFixture<GruposInvestigacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GruposInvestigacionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GruposInvestigacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
