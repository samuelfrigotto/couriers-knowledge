import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImmortalRecentMatchesComponent } from './immortal-recent-matches.component';

describe('ImmortalRecentMatchesComponent', () => {
  let component: ImmortalRecentMatchesComponent;
  let fixture: ComponentFixture<ImmortalRecentMatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImmortalRecentMatchesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImmortalRecentMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
