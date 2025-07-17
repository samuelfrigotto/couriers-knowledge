import { TestBed } from '@angular/core/testing';

import { GsiService } from './gsi.service';

describe('GsiService', () => {
  let service: GsiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GsiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
