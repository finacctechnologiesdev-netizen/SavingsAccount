import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecureCookieService {
  private readonly SECRET_KEY = 'SBA_SECURE_AUTH_KEY_2026'; // Native hash seed

  /**
   * Set a cookie securely with simple obfuscation
   * @param name Name of the cookie
   * @param value Value to store (objects should be JSON.stringified beforehand)
   * @param days Validity in days
   */
  public set(name: string, value: string, days: number = 7): void {
    if (typeof document === 'undefined') return;
    
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = `; expires=${date.toUTCString()}`;
    }
    
    // Hash/Encrypt the data before saving
    const encryptedValue = this.hashData(value);
    
    // Store in cookie
    document.cookie = `${name}=${encryptedValue}${expires}; path=/; SameSite=Strict`;
  }

  /**
   * Get an obfuscated cookie value and decode it
   * @param name Name of the cookie
   */
  public get(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const encryptedValue = c.substring(nameEQ.length, c.length);
            return this.unhashData(encryptedValue);
        }
    }
    return null;
  }

  /**
   * Delete a cookie by setting its expiration to the past
   */
  public delete(name: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=; Max-Age=-99999999; path=/`;
  }

  /**
   * Clear all stored cookies
   */
  public clearAll(): void {
    if (typeof document === 'undefined') return;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        this.delete(name.trim());
    }
  }

  /**
   * Obfuscate/Hash string via XOR and Base64 encoding
   */
  private hashData(value: string): string {
    if (!value) return '';
    try {
      let result = '';
      for (let i = 0; i < value.length; i++) {
          result += String.fromCharCode(value.charCodeAt(i) ^ this.SECRET_KEY.charCodeAt(i % this.SECRET_KEY.length));
      }
      return btoa(result);
    } catch(e) {
      console.error('Failed to hash cookie data', e);
      return '';
    }
  }

  /**
   * De-Obfuscate/Unhash Base64 string via XOR 
   */
  private unhashData(encoded: string): string | null {
    if (!encoded) return null;
    try {
      const decoded = atob(encoded);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
          result += String.fromCharCode(decoded.charCodeAt(i) ^ this.SECRET_KEY.charCodeAt(i % this.SECRET_KEY.length));
      }
      return result;
    } catch(e) {
      console.error('Failed to unhash cookie data', e);
      return null;
    }
  }
}
