import { TestBed } from '@angular/core/testing';

import { GetPremiumService } from './get-premium.service';

describe('GetPremiumService', () => {
  let service: GetPremiumService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GetPremiumService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
