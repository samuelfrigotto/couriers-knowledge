import { TestBed } from '@angular/core/testing';

import { ImmortalService } from './immortal.service';

describe('ImmortalService', () => {
  let service: ImmortalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImmortalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
