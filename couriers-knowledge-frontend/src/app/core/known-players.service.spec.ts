import { TestBed } from '@angular/core/testing';

import { KnownPlayersService } from './known-players.service';

describe('KnownPlayersService', () => {
  let service: KnownPlayersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KnownPlayersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
