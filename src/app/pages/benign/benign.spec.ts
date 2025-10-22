import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Benign } from './benign';

describe('Benign', () => {
  let component: Benign;
  let fixture: ComponentFixture<Benign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Benign]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Benign);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
