import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicacionesAutorComponent } from './publicaciones-autor.component';

describe('PublicacionesAutorComponent', () => {
  let component: PublicacionesAutorComponent;
  let fixture: ComponentFixture<PublicacionesAutorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicacionesAutorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicacionesAutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
