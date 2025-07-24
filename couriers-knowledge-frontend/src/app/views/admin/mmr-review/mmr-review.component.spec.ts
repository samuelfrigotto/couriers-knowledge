import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MmrReviewComponent } from './mmr-review.component';

describe('MmrReviewComponent', () => {
  let component: MmrReviewComponent;
  let fixture: ComponentFixture<MmrReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MmrReviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MmrReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
