import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { premiumRedirectGuard } from './premium-redirect.guard';

describe('premiumRedirectGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => premiumRedirectGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
