import { TestBed } from '@angular/core/testing';

import { DisciplinesService } from './disciplines.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MockedComponentFixture, MockRender } from 'ng-mocks';
import { DefaultService } from '@orvium/api';
import { of } from 'rxjs';

describe('DisciplinesService', () => {
  let fixture: MockedComponentFixture<DisciplinesService, DisciplinesService>;
  let service: DisciplinesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    fixture = MockRender(DisciplinesService);
    service = fixture.point.componentInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get disciplines', () => {
    const apiService = TestBed.inject(DefaultService);
    const spy = jest.spyOn(apiService, 'getDisciplines').mockReturnValue(of([]) as never);
    service.getDisciplines().subscribe();

    // Now should return cached disciplines
    service.getDisciplines().subscribe();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
