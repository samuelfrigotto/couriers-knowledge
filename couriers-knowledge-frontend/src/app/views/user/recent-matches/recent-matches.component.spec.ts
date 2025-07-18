import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentMatchesComponent } from './recent-matches.component';

describe('RecentMatchesComponent', () => {
  let component: RecentMatchesComponent;
  let fixture: ComponentFixture<RecentMatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecentMatchesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RecentMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
