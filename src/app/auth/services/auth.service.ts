import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environments';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';

import { AuthStatus, CheckTokenResponse, LoginResponse, User } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly baseUrl: string = environment.baseUrl;


  //private http = inject( HttpClient );

  private _currentUser = signal<User|null>(null);
  private _authStatus = signal<AuthStatus>( AuthStatus.checking );

  //! Al mundo exterior
  public currentUser = computed( () => this._currentUser() );
  public authStatus = computed( () => this._authStatus() );


  constructor(private http: HttpClient ) {
    this.checkAuthStatus().subscribe();
  }

  private setAuthentication(user: User, token:string): boolean {
    this._currentUser.set( user );
    this._authStatus.set( AuthStatus.authenticated );
    // Aqui guarda el token en el localstorage
    localStorage.setItem('token', token);

    return true;
  }



  // login funcion que recibe 2 parametros email y password
  login( email: string, password: string ): Observable<boolean> {
    // llama la url principal de los enviromnets y la une con el resto de la direccion a consultar
    const url  = `${ this.baseUrl }/auth/login`;
    // simplemente se crea un objeto con el email y el password para enviarlos
    const body = { email, password };
    //console.log(url, body);
    // this.http.post esta usando HttpClient con el metodo POST para enviar a la url el body
    return this.http.post<LoginResponse>( url, body )
      .pipe(
        map( ({ user, token }) => this.setAuthentication( user, token )),
        catchError( err => throwError( () => err.error.message ))
      );
  }









  checkAuthStatus():Observable<boolean> {

    const url   = `${ this.baseUrl }/auth/check-token`;
    const token = localStorage.getItem('token');

    if ( !token ) {
      this.logout();
      return of(false);
    }

    const headers = new HttpHeaders()
      .set('Authorization', `Bearer ${ token }`);


      return this.http.get<CheckTokenResponse>(url, { headers })
        .pipe(
          map( ({ user, token }) => this.setAuthentication( user, token )),
          catchError(() => {
            this._authStatus.set( AuthStatus.notAuthenticated );
            return of(false);
          })
        );


  }

  logout() {
    localStorage.removeItem('token');
    this._currentUser.set(null);
    this._authStatus.set( AuthStatus.notAuthenticated );

  }


}
