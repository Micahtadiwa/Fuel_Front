import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendantComponent } from './attendant.component';

describe('AttendantComponent', () => {
  let component: AttendantComponent;
  let fixture: ComponentFixture<AttendantComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AttendantComponent]
    });
    fixture = TestBed.createComponent(AttendantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
