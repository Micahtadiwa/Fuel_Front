import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DieseltankComponent } from './dieseltank.component';

describe('DieseltankComponent', () => {
  let component: DieseltankComponent;
  let fixture: ComponentFixture<DieseltankComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DieseltankComponent]
    });
    fixture = TestBed.createComponent(DieseltankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
