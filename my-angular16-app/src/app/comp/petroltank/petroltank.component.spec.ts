import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetroltankComponent } from './petroltank.component';

describe('PetroltankComponent', () => {
  let component: PetroltankComponent;
  let fixture: ComponentFixture<PetroltankComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PetroltankComponent]
    });
    fixture = TestBed.createComponent(PetroltankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
