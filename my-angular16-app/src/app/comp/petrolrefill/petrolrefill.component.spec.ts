import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PetrolrefillComponent } from './petrolrefill.component';

describe('PetrolrefillComponent', () => {
  let component: PetrolrefillComponent;
  let fixture: ComponentFixture<PetrolrefillComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PetrolrefillComponent]
    });
    fixture = TestBed.createComponent(PetrolrefillComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
