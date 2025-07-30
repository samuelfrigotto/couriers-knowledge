import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EuropeLeaderboardComponent } from './europe-leaderboard.component';

describe('EuropeLeaderboardComponent', () => {
  let component: EuropeLeaderboardComponent;
  let fixture: ComponentFixture<EuropeLeaderboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EuropeLeaderboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EuropeLeaderboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
