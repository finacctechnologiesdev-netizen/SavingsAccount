import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withHashLocation } from '@angular/router';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { DatePipe } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes,  withHashLocation()),
    provideHttpClient(),
    DatePipe
  ],
};

//withPreloading(PreloadAllModules),
