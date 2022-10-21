import { Injectable } from '@angular/core';
import { JhiLanguageService } from 'ng-jhipster';
import { SessionStorageService } from 'ngx-webstorage';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { SERVER_API_URL } from 'app/app.constants';
import { Account } from 'app/core/user/account.model';
import { IMSUser } from 'app/shared/model/user.model';
import { MSMemberService } from 'app/entities/member/member.service';
import { ISFMemberData } from 'app/shared/model/salesforce-member-data.model';
import { SFMemberContact } from 'app/shared/model/salesforce-member-contact.model copy';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private userIdentity: any;
  private memberData: BehaviorSubject<ISFMemberData> = new BehaviorSubject<ISFMemberData>(null);
  private authenticated = false;
  private authenticationState = new Subject<any>();
  private logoutAsResourceUrl = SERVER_API_URL + 'services/userservice/api';

  constructor(
    private languageService: JhiLanguageService,
    private sessionStorage: SessionStorageService,
    private http: HttpClient,
    private memberService: MSMemberService
  ) {}

  fetch(): Observable<HttpResponse<Account>> {
    return this.http.get<Account>(SERVER_API_URL + 'services/userservice/api/account', { observe: 'response' });
  }

  getMfaSetup(): Observable<HttpResponse<any>> {
    return this.http.get<any>(SERVER_API_URL + 'services/userservice/api/account/mfa', { observe: 'response' });
  }

  save(account: any): Observable<HttpResponse<any>> {
    return this.http.post(SERVER_API_URL + 'services/userservice/api/account', account, { observe: 'response' });
  }

  enableMfa(mfaSetup: any): Observable<HttpResponse<any>> {
    return this.http.post(SERVER_API_URL + 'services/userservice/api/account/mfa/on', mfaSetup, { observe: 'response' });
  }

  disableMfa(): Observable<HttpResponse<any>> {
    return this.http.post(SERVER_API_URL + 'services/userservice/api/account/mfa/off', null, { observe: 'response' });
  }

  authenticate(identity) {
    this.userIdentity = identity;
    this.authenticated = identity !== null;
    this.authenticationState.next(this.userIdentity);
  }

  hasAnyAuthority(authorities: string[]): boolean {
    if (!this.authenticated || !this.userIdentity || !this.userIdentity.authorities) {
      return false;
    }

    for (let i = 0; i < authorities.length; i++) {
      if (this.userIdentity.authorities.includes(authorities[i])) {
        return true;
      }
    }

    return false;
  }

  hasAuthority(authority: string): Promise<boolean> {
    if (!this.authenticated) {
      return Promise.resolve(false);
    }

    return this.identity().then(
      id => {
        return Promise.resolve(id.authorities && id.authorities.includes(authority));
      },
      () => {
        return Promise.resolve(false);
      }
    );
  }

  identity(force?: boolean): Promise<IMSUser> {
    if (force) {
      this.userIdentity = undefined;
      this.memberData.next(null);
    }

    // check and see if we have retrieved the userIdentity data from the server.
    // if we have, reuse it by immediately resolving
    if (this.userIdentity) {
      return Promise.resolve(this.userIdentity);
    }

    // retrieve the userIdentity data from the server, update the identity object, and then resolve.
    return this.fetch()
      .toPromise()
      .then(response => {
        const account: Account = response.body;
        if (account) {
          this.userIdentity = account;
          this.authenticated = true;
          // After retrieve the account info, the language will be changed to
          // the user's preferred language configured in the account setting
          if (this.userIdentity.langKey) {
            const langKey = this.sessionStorage.retrieve('locale') || this.userIdentity.langKey;
            this.languageService.changeLanguage(langKey);
          }
        } else {
          this.memberData.next(null);
          this.userIdentity = null;
          this.authenticated = false;
        }
        this.authenticationState.next(this.userIdentity);
        return this.userIdentity;
      })
      .catch(err => {
        this.userIdentity = null;
        this.memberData.next(null);
        this.authenticated = false;
        this.authenticationState.next(this.userIdentity);
        return null;
      });
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  isIdentityResolved(): boolean {
    return this.userIdentity !== undefined;
  }

  getAuthenticationState(): Observable<any> {
    return this.authenticationState.asObservable();
  }

  getImageUrl(): string {
    return this.isIdentityResolved() ? this.userIdentity.imageUrl : null;
  }

  getUserName(): string {
    let userName: string;

    if (this.isIdentityResolved()) {
      if (this.userIdentity.firstName) {
        userName = this.userIdentity.firstName;
      }
      if (this.userIdentity.lastName) {
        if (userName) {
          userName = userName + ' ' + this.userIdentity.lastName;
        } else {
          userName = this.userIdentity.lastName;
        }
      }
      if (userName == null) {
        userName = this.userIdentity.email;
      }
    }
    return userName;
  }

  getSalesforceId(): string {
    return this.isAuthenticated() && this.userIdentity ? this.userIdentity.salesforceId : null;
  }

  async getCurrentMemberData(): Promise<BehaviorSubject<ISFMemberData>> {
    if (this.memberData.value === null && this.userIdentity) {
      console.log('getCurrentMemberData(): running', new Date().toLocaleString());
      await this.memberService
        .getMember()
        .toPromise()
        .then(res => {
          console.log('getCurrentMemberData(): done', new Date().toLocaleString());
          if (res) {
            this.memberData.next(res);
            this.memberService
              .getMemberContacts()
              .toPromise()
              .then(res => {
                if (res) {
                  this.memberData.value.contacts = res;
                }
              });
            if (res && res.consortiaLeadId) {
              this.memberService
                .find(res.consortiaLeadId)
                .toPromise()
                .then(r => {
                  if (r && r.body) {
                    this.memberData.value.consortiumLeadName = r.body.clientName;
                  }
                });
            }
            if (this.userIdentity.salesforceId) {
              this.memberService
                .find(this.userIdentity.salesforceId)
                .toPromise()
                .then(r => {
                  if (r && r.body) {
                    this.memberData.value.isConsortiumLead = r.body.isConsortiumLead;
                  }
                });
            }
          }
        });
    }
    return this.memberData;
  }

  isOrganizationOwner(): string {
    return this.isIdentityResolved() && this.userIdentity ? this.userIdentity.mainContact : false;
  }

  isLoggedAs(): boolean {
    return !!(this.isIdentityResolved() && this.userIdentity && this.userIdentity.loggedAs);
  }

  logoutAs(): Observable<any> {
    const formData = new FormData();
    formData.set('username', this.userIdentity.loginAs);
    return this.http.post(`${this.logoutAsResourceUrl}/logout_as`, formData, {
      headers: new HttpHeaders().set('Accept', 'text/html'),
      withCredentials: true,
      responseType: 'text'
    });
  }
}
