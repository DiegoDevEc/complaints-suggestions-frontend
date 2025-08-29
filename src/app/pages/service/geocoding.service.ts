// geocoding.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';

interface GeocodeResponse {
  results: GeocodeResult[];
  status: string;
}
interface GeocodeResult {
  formatted_address: string;
  types: string[];
  address_components: { long_name: string; short_name: string; types: string[] }[];
  geometry: { location_type: string };
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private http = inject(HttpClient);
  private endpoint = 'https://maps.googleapis.com/maps/api/geocode/json';

  /**
   * Devuelve SOLO un string con una dirección humana.
   * - Filtra en el request: route | street_address (evita plus_code)
   * - Prioriza street_address > route > rooftop con route
   * - Formatea en una línea con "calle número y cruce, barrio, ciudad, provincia, CP país"
   */
  reverseGeocodeToString(lat: number, lng: number): Observable<string> {
    const params = new HttpParams()
      .set('latlng', `${lat},${lng}`)
      .set('result_type', 'route|street_address')
      .set('language', 'es')                // resultados en español
      .set('key', environment.googleMapsApiKey);

    return this.http.get<GeocodeResponse>(this.endpoint, { params }).pipe(
      map(resp => {
        const results = resp?.results ?? [];
        if (!results.length) return 'Dirección no encontrada';

        const best = this.pickBestResult(results);
        const human = this.formatAddress(best) || best.formatted_address || 'Dirección no disponible';
        return this.sanitizeLine(human);
      }),
      catchError(() => of('No se pudo obtener la dirección'))
    );
  }

  /** Selección de mejor resultado evitando plus_code y priorizando calle */
  private pickBestResult(results: GeocodeResult[]): GeocodeResult {
    // Evita plus_code por si Google lo llega a devolver igual
    const nonPlus = results.filter(r => !r.types?.includes('plus_code'));

    // 1) Dirección exacta de calle
    const street = nonPlus.find(r => r.types?.includes('street_address'));
    if (street) return street;

    // 2) Ruta (avenida/calle)
    const route = nonPlus.find(r => r.types?.includes('route'));
    if (route) return route;

    // 3) ROOFTOP que tenga un componente "route"
    const rooftopWithRoute = nonPlus.find(r =>
      r.geometry?.location_type === 'ROOFTOP' &&
      r.address_components?.some(c => c.types.includes('route'))
    );
    if (rooftopWithRoute) return rooftopWithRoute;

    // 4) Cualquiera que tenga "route"
    const anyWithRoute = nonPlus.find(r =>
      r.address_components?.some(c => c.types.includes('route'))
    );
    if (anyWithRoute) return anyWithRoute;

    // 5) Fallback
    return nonPlus[0] || results[0];
  }

  /** Construye una línea legible a partir de address_components */
  private formatAddress(r: GeocodeResult): string {
    const get = (t: string) => r.address_components.find(c => c.types.includes(t))?.long_name;
    const getAll = (t: string) => r.address_components.filter(c => c.types.includes(t)).map(c => c.long_name);

    const num = get('street_number');                 // p.ej. 580
    const routes = getAll('route');                   // p.ej. ["Av. Simón Bolívar", "Otra calle"]
    const route = routes[0];
    const cross = routes.length > 1 ? routes[1] : undefined;

    const sublocality = get('sublocality') || get('sublocality_level_1'); // barrio/sector
    const city = get('locality');                     // Quito
    const prov = get('administrative_area_level_1');  // Pichincha
    const postal = get('postal_code');                // 170902
    const country = get('country');                   // Ecuador

    // Línea principal
    let line1 = '';
    if (route && num) line1 = `${route} ${num}`;
    else if (route) line1 = route;

    if (cross) line1 = line1 ? `${line1} y ${cross}` : `${route} y ${cross}`;

    // Cola: barrio/ciudad/provincia + CP + país
    const parts = [
      line1,
      [sublocality, city, prov].filter(Boolean).join(', '),
      [postal, country].filter(Boolean).join(' ')
    ].filter(Boolean);

    return parts.join(', ');
  }

  /** Limpia espacios múltiples y comas repetidas */
  private sanitizeLine(s: string): string {
    return s
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*,/g, ', ')
      .replace(/,\s*$/, '')
      .trim();
  }
}
