import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SteamIntegrationBannerComponent } from './steam-integration-banner.component';

describe('SteamIntegrationBannerComponent', () => {
  let component: SteamIntegrationBannerComponent;
  let fixture: ComponentFixture<SteamIntegrationBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SteamIntegrationBannerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SteamIntegrationBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
