import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DieselrefillComponent } from './dieselrefill.component';

describe('DieselrefillComponent', () => {
  let component: DieselrefillComponent;
  let fixture: ComponentFixture<DieselrefillComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DieselrefillComponent]
    });
    fixture = TestBed.createComponent(DieselrefillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
