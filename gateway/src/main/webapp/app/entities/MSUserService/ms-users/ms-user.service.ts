import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { DATE_FORMAT } from 'app/shared/constants/input.constants';
import { map } from 'rxjs/operators';

import { SERVER_API_URL } from 'app/app.constants';
import { createRequestOption } from 'app/shared';
import { IMSUser } from 'app/shared/model/MSUserService/ms-user.model';

type EntityResponseType = HttpResponse<IMSUser>;
type EntityArrayResponseType = HttpResponse<IMSUser[]>;

@Injectable({ providedIn: 'root' })
export class MSUserService {
  public resourceUrl = SERVER_API_URL + 'services/user-service/api/users';

  constructor(protected http: HttpClient) {}

  create(msUser: IMSUser): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(msUser);
    return this.http
      .post<IMSUser>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  upload(msUser: IMSUser): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(msUser);
    return this.http
      .post<IMSUser>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  update(msUser: IMSUser): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(msUser);
    return this.http
      .put<IMSUser>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  find(login: string): Observable<EntityResponseType> {
    console.log('login:' + login);
    return this.http
      .get<IMSUser>(`${this.resourceUrl}/${login}`, { observe: 'response' })
      .pipe(map((res: EntityResponseType) => this.convertDateFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<IMSUser[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map((res: EntityArrayResponseType) => this.convertDateArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<any>> {
    return this.http.delete<any>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  protected convertDateFromClient(msUser: IMSUser): IMSUser {
    const copy: IMSUser = Object.assign({}, msUser, {
      createdDate: msUser.createdDate != null && msUser.createdDate.isValid() ? msUser.createdDate.toJSON() : null,
      lastModifiedDate: msUser.lastModifiedDate != null && msUser.lastModifiedDate.isValid() ? msUser.lastModifiedDate.toJSON() : null
    });
    return copy;
  }

  protected convertDateFromServer(res: EntityResponseType): EntityResponseType {
    if (res.body) {
      res.body.createdDate = res.body.createdDate != null ? moment(res.body.createdDate) : null;
      res.body.lastModifiedDate = res.body.lastModifiedDate != null ? moment(res.body.lastModifiedDate) : null;
    }
    return res;
  }

  protected convertDateArrayFromServer(res: EntityArrayResponseType): EntityArrayResponseType {
    if (res.body) {
      res.body.forEach((msUser: IMSUser) => {
        msUser.createdDate = msUser.createdDate != null ? moment(msUser.createdDate) : null;
        msUser.lastModifiedDate = msUser.lastModifiedDate != null ? moment(msUser.lastModifiedDate) : null;
      });
    }
    return res;
  }
}