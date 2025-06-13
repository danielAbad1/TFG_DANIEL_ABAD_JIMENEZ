import { TestBed } from '@angular/core/testing';

import { ScopusService } from './scopus.service';

describe('ScopusService', () => {
  let service: ScopusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScopusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
