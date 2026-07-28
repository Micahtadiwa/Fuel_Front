import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclinedusersComponent } from './declinedusers.component';

describe('DeclinedusersComponent', () => {
  let component: DeclinedusersComponent;
  let fixture: ComponentFixture<DeclinedusersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeclinedusersComponent]
    });
    fixture = TestBed.createComponent(DeclinedusersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
