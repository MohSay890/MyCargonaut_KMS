import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { VehicleEditorComponent } from './vehicle-editor.component';
import { of } from 'rxjs';

describe('VehicleEditorComponent', () => {
  let component: VehicleEditorComponent;
  let fixture: ComponentFixture<VehicleEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleEditorComponent]
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of ({}),
            snapshot: { params: {} }
          }}]
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
