import { CanActivateFn } from '@angular/router';

export const premiumRedirectGuard: CanActivateFn = (route, state) => {
  return true;
};
