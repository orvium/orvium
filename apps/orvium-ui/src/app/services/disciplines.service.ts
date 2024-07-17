import { Injectable } from '@angular/core';
import { DefaultService, DisciplineDTO } from '@orvium/api';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

/**
 * Provides a service for managing and retrieving disciplines within an application.
 * It leverages a caching mechanism to store the list of disciplines once fetched,
 * avoiding redundant API calls. This service can be injected into any component or
 * other services within the application to access discipline information.
 */
@Injectable({
  providedIn: 'root',
})
export class DisciplinesService {
  /** List of disciplines as DTOs */
  private disciplines?: Observable<DisciplineDTO[]>;

  /**
   * Constructs the DisciplinesService.
   *
   * @param {DefaultService} apiService - The API service for fetching discipline data from a backend server.
   */
  constructor(private apiService: DefaultService) {}

  /**
   * Retrieves an observable of the list of disciplines, utilizing a caching mechanism
   * to prevent unnecessary API calls. If the disciplines have already been fetched,
   * the cached result is returned instead of a new API call.
   *
   * @returns {Observable<DisciplineDTO[]>} An Observable that emits the list of disciplines.
   */
  getDisciplines(): Observable<DisciplineDTO[]> {
    if (!this.disciplines) {
      this.disciplines = this.apiService.getDisciplines().pipe(shareReplay(1));
    }

    return this.disciplines;
  }
}
