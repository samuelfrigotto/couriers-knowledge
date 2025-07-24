import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MmrVerificationComponent } from './mmr-verification.component';

describe('MmrVerificationComponent', () => {
  let component: MmrVerificationComponent;
  let fixture: ComponentFixture<MmrVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MmrVerificationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MmrVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
