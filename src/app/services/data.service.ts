import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private baseUrl = 'https://app.finaccsaas.in/data/savingsac/RestApi.php';

  constructor(private http: HttpClient) { }

  private getParams(params: any = {}, responseType: 'json' | 'text' = 'json'): any {
    let headers = new HttpHeaders();
    const authToken = localStorage.getItem('AuthToken');

    if (authToken) {
      headers = headers.set('Authorization', `Bearer ${authToken}`);
    } else {
      console.warn("DataService: No AuthToken found in localStorage!");
    }

    let clientCode = localStorage.getItem('Client_Code');
    const finalParams = { ...params };

    if (clientCode) {
      // Force lowercase as backend database routing is often case-sensitive for the directory/client match
      finalParams['ClientCode'] = clientCode.toLowerCase();
    }

    const options: any = {
      headers: headers,
      params: finalParams
    };

    if (responseType === 'text') {
      options.responseType = 'text';
    }

    return options;
  }

  // Method to extract JSON from potentially polluted response (PHP warnings etc)
  private sanitizeResponse(response: any): any {
    if (typeof response !== 'string') return response;

    try {
      // Handle raw HTML/PHP errors without backend changes
      const errorText = response.toLowerCase();
      
      // Concurrency Error
      if (errorText.includes('concurrency error') || errorText.includes('record not found')) {
        return {
          Status: 'Error',
          success: false,
          error: 'CONCURRENCY_ERROR',
          Message: 'Record was modified by another user. Please refresh and try again.',
          userMessage: 'Record was modified by another user. Please refresh and try again.',
          technicalDetails: response
        };
      }
      
      // Foreign Key Constraint (previous scheme deletion)
      if (errorText.includes('reference constraint') || errorText.includes('fk_rd_accounts_rdscheme')) {
        return {
          Status: 'Error',
          success: false,
          error: 'FOREIGN_KEY_ERROR',
          Message: 'Cannot delete - related records exist. Delete child records first.',
          userMessage: 'Cannot delete - related records exist. Delete child records first.',
          technicalDetails: response
        };
      }
      
      // Datetime2 errors (previous accounts issue)
      if (errorText.includes('operand type clash') || errorText.includes('datetime2')) {
        return {
          Status: 'Error',
          success: false,
          error: 'DATETIME_ERROR',
          Message: 'Invalid date/time format. Please check your input.',
          userMessage: 'Invalid date/time format. Please check your input.',
          technicalDetails: response
        };
      }
      
      // Duplicate Key error
      if (errorText.includes('duplicate key') || errorText.includes('unique constraint') || errorText.includes('violation of primary key')) {
        return {
          Status: 'Error',
          success: false,
          error: 'DUPLICATE_KEY_ERROR',
          Message: 'Record already exists with the values Entered',
          userMessage: 'Record already exists with the values Entered',
          technicalDetails: response
        };
      }

      // Generic PHP Fatal errors
      if (errorText.includes('fatal error') || errorText.includes('uncaught exception')) {
        return {
          Status: 'Error',
          success: false,
          error: 'SERVER_ERROR',
          Message: 'Server encountered a critical error processing this request.',
          userMessage: 'Server encountered a critical error processing this request.',
          technicalDetails: response
        };
      }

      // Find the first occurrence of { or [
      const objectStart = response.indexOf('{');
      const arrayStart = response.indexOf('[');
      let startIndex = -1;

      if (objectStart !== -1 && arrayStart !== -1) {
        startIndex = Math.min(objectStart, arrayStart);
      } else if (objectStart !== -1) {
        startIndex = objectStart;
      } else {
        startIndex = arrayStart;
      }

      if (startIndex !== -1) {
        let endIndex = -1;
        if (response[startIndex] === '{') {
          endIndex = response.lastIndexOf('}');
        } else if (response[startIndex] === '[') {
          endIndex = response.lastIndexOf(']');
        }

        if (endIndex !== -1 && endIndex >= startIndex) {
            const cleanJson = response.substring(startIndex, endIndex + 1);
            return JSON.parse(cleanJson);
        }

        const jsonString = response.substring(startIndex);
        return JSON.parse(jsonString);
      }

      // Fallback if no clean start found, try parsing as is
      return JSON.parse(response);
    } catch (e) {
      // If parsing fails (e.g., "[Microsoft] ... SQL error string"), wrap it in an error object
      console.error('SERVER SQL or PHP ERROR:', response);
      console.warn('Could not sanitize response, parsing as JSON failed', e);
      return { Status: 'Error', Message: response, userMessage: 'Unexpected server response format.', rawResponse: response };
    }
  }

  get<T>(path: string, params: any = {}): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}/${path}`, this.getParams(params, 'text'))
      .pipe(map((res: any) => this.sanitizeResponse(res))) as Observable<T>;
  }

  post<T>(path: string, body: any, params: any = {}): Observable<T> {
    return this.http.post(`${this.baseUrl}/${path}`, body, this.getParams(params, 'text'))
      .pipe(map((res: any) => this.sanitizeResponse(res))) as Observable<T>;
  }

  put<T>(path: string, body: any, params: any = {}): Observable<T> {
    return this.http.put(`${this.baseUrl}/${path}`, body, this.getParams(params, 'text'))
      .pipe(map((res: any) => this.sanitizeResponse(res))) as Observable<T>;
  }

  delete<T>(path: string, params: any = {}): Observable<T> {
    return this.http.delete(`${this.baseUrl}/${path}`, this.getParams(params, 'text'))
      .pipe(map((res: any) => this.sanitizeResponse(res))) as Observable<T>;
  }
}