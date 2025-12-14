import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleEditorComponent } from './vehicle-editor.component';

describe('VehicleEditorComponent', () => {
  let component: VehicleEditorComponent;
  let fixture: ComponentFixture<VehicleEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
