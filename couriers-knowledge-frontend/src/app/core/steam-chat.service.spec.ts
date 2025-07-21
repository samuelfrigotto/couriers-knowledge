import { TestBed } from '@angular/core/testing';

import { SteamChatService } from './steam-chat.service';

describe('SteamChatService', () => {
  let service: SteamChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SteamChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
