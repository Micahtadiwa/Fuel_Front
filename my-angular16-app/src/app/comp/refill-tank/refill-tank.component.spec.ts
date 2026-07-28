import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RefillTankComponent } from './refill-tank.component';

describe('RefillTankComponent', () => {
  let component: RefillTankComponent;
  let fixture: ComponentFixture<RefillTankComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RefillTankComponent]
    });
    fixture = TestBed.createComponent(RefillTankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
