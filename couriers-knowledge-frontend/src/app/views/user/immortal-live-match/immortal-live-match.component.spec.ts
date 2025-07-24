import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImmortalLiveMatchComponent } from './immortal-live-match.component';

describe('ImmortalLiveMatchComponent', () => {
  let component: ImmortalLiveMatchComponent;
  let fixture: ComponentFixture<ImmortalLiveMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImmortalLiveMatchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImmortalLiveMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
