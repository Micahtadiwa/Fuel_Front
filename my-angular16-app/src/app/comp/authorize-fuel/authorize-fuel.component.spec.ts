import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthorizeFuelComponent } from './authorize-fuel.component';

describe('AuthorizeFuelComponent', () => {
  let component: AuthorizeFuelComponent;
  let fixture: ComponentFixture<AuthorizeFuelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AuthorizeFuelComponent]
    });
    fixture = TestBed.createComponent(AuthorizeFuelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
