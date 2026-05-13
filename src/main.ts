import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
console.log('🔥 THIS IS THE PROJECT I AM EDITING 🔥');

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
