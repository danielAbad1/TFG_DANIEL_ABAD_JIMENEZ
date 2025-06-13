import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScopusPublicacionesComponent } from './scopus-publicaciones.component';

describe('ScopusPublicacionesComponent', () => {
  let component: ScopusPublicacionesComponent;
  let fixture: ComponentFixture<ScopusPublicacionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScopusPublicacionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScopusPublicacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
