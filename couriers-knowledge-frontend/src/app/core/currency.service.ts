// src/app/core/currency.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface PlanPricing {
  monthly: number;
  semiannual: number;
  annual: number;
}

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly STORAGE_KEY = 'app_currency';
  private readonly DEFAULT_CURRENCY = 'BRL';

  public readonly availableCurrencies: Currency[] = [
    { code: 'BRL', name: 'Real (R$)', symbol: 'R$' },
    { code: 'USD', name: 'Dollar ($)', symbol: '$' },
  ];

  private currentCurrencySubject = new BehaviorSubject<string>(this.DEFAULT_CURRENCY);
  public currentCurrency$: Observable<string> = this.currentCurrencySubject.asObservable();

  // Preços fixos por moeda
  private readonly pricing: { [key: string]: PlanPricing } = {
    BRL: {
      monthly: 24.90,
      semiannual: 19.90,
      annual: 14.90
    },
    USD: {
      monthly: 4.99,
      semiannual: 3.99,
      annual: 2.99
    }
  };

  constructor() {
    this.loadCurrencyFromStorage();
  }

  getCurrentCurrency(): string {
    return this.currentCurrencySubject.value;
  }

  setCurrentCurrency(currencyCode: string): void {
    if (this.availableCurrencies.some((currency) => currency.code === currencyCode)) {
      this.currentCurrencySubject.next(currencyCode);
      this.saveCurrencyToStorage(currencyCode);
    }
  }

  getCurrentCurrencyInfo(): Currency {
    const currentCode = this.getCurrentCurrency();
    return (
      this.availableCurrencies.find((currency) => currency.code === currentCode) ||
      this.availableCurrencies[0]
    );
  }

  getPricing(currencyCode?: string): PlanPricing {
    const currency = currencyCode || this.getCurrentCurrency();
    return this.pricing[currency] || this.pricing[this.DEFAULT_CURRENCY];
  }

  formatPrice(amount: number, currencyCode?: string): string {
    const currency = currencyCode || this.getCurrentCurrency();
    const currencyInfo = this.availableCurrencies.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || 'R$';

    if (currency === 'BRL') {
      return `${symbol} ${amount.toFixed(2).replace('.', ',')}`;
    } else {
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  private loadCurrencyFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const savedCurrency = localStorage.getItem(this.STORAGE_KEY);
      if (
        savedCurrency &&
        this.availableCurrencies.some((currency) => currency.code === savedCurrency)
      ) {
        this.currentCurrencySubject.next(savedCurrency);
      }
    }
  }

  private saveCurrencyToStorage(currencyCode: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, currencyCode);
    }
  }
}
