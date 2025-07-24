import { TestBed } from '@angular/core/testing';

import { MmrVerificationService } from './mmr-verification.service';

describe('MmrVerificationService', () => {
  let service: MmrVerificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MmrVerificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
