import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { JhiEventManager, JhiParseLinks, JhiAlertService } from 'ng-jhipster';
import { faChartBar, faFileDownload, faFileImport, faTimes, faSearch, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

import { IAssertion } from 'app/shared/model/assertion.model';
import { AccountService } from 'app/core';

import { ITEMS_PER_PAGE } from 'app/shared';
import { AssertionService } from './assertion.service';
import { ORCID_BASE_URL } from 'app/app.constants';
import { ASSERTION_STATUS } from 'app/shared/constants/orcid-api.constants';
import { tap, delay } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'jhi-assertion',
  templateUrl: './assertion.component.html',
  styleUrls: ['assertion.scss']
})
export class AssertionComponent implements OnInit, OnDestroy {
  errorAddingToOrcid: string = ASSERTION_STATUS.ERROR_ADDING_TO_ORCID;
  errorUpdatingInOrcid: string = ASSERTION_STATUS.ERROR_UPDATING_TO_ORCID;
  errorDeletingInOrcid: string = ASSERTION_STATUS.ERROR_DELETING_IN_ORCID;
  currentAccount: any;
  assertions: IAssertion[];
  error: any;
  success: any;
  eventSubscriber: Subscription;
  importEventSubscriber: Subscription;
  notificationSubscription: Subscription;
  routeData: Subscription;
  links: any;
  totalItems: any;
  itemsPerPage: any;
  page: any;
  predicate: any;
  reverse: any;
  orcidBaseUrl: string = ORCID_BASE_URL;
  itemCount: string;
  faChartBar = faChartBar;
  faFileDownload = faFileDownload;
  faFileImport = faFileImport;
  faTimes = faTimes;
  faSearch = faSearch;
  faPaperPlane = faPaperPlane;
  searchTerm: string;
  submittedSearchTerm: string;
  showEditReportPendingMessage: boolean;
  showStatusReportPendingMessage: boolean;
  showLinksReportPendingMessage: boolean;
  paginationHeaderSubscription: Subscription;

  constructor(
    protected assertionService: AssertionService,
    protected parseLinks: JhiParseLinks,
    protected jhiAlertService: JhiAlertService,
    protected accountService: AccountService,
    protected activatedRoute: ActivatedRoute,
    protected router: Router,
    protected eventManager: JhiEventManager,
    protected translate: TranslateService
  ) {
    this.itemsPerPage = ITEMS_PER_PAGE;
  }

  ngOnInit() {
    this.accountService.identity().then(account => {
      this.currentAccount = account;
    });
    this.eventSubscriber = this.eventManager.subscribe('assertionListModification', () => {
      this.searchTerm = '';
      this.submittedSearchTerm = '';
      this.loadAll();
    });
    this.importEventSubscriber = this.eventManager.subscribe('importAssertions', () => {
      this.loadAll();
    });
    this.notificationSubscription = this.eventManager.subscribe('sendNotifications', () => {
      this.loadAll();
    });
    this.routeData = this.activatedRoute.data.subscribe(data => {
      this.page = data.pagingParams.page;
      this.reverse = data.pagingParams.ascending;
      this.predicate = data.pagingParams.predicate;
      this.loadAll();
    });
  }

  loadAll() {
    this.assertionService
      .query({
        page: this.page - 1,
        size: this.itemsPerPage,
        sort: this.sort(),
        filter: this.submittedSearchTerm ? this.submittedSearchTerm : ''
      })
      .subscribe(
        (res: HttpResponse<IAssertion[]>) => this.paginateAssertions(res.body, res.headers),
        (res: HttpErrorResponse) => this.onError(res.message)
      );
  }

  transition() {
    this.router.navigate(['/assertion'], {
      queryParams: {
        page: this.page,
        size: this.itemsPerPage,
        sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc'),
        filter: this.submittedSearchTerm ? this.submittedSearchTerm : ''
      }
    });
    this.loadAll();
  }

  clear() {
    this.page = 0;
    this.router.navigate([
      '/assertion',
      {
        page: this.page,
        sort: this.predicate + ',' + (this.reverse ? 'asc' : 'desc'),
        filter: this.submittedSearchTerm ? this.submittedSearchTerm : ''
      }
    ]);
    this.loadAll();
  }

  trackId(index: number, item: IAssertion) {
    return item.id;
  }

  sort() {
    const result = [this.predicate + ',' + (this.reverse ? 'asc' : 'desc')];
    if (this.predicate !== 'id') {
      result.push('id');
    }
    return result;
  }

  generatePermissionLinks() {
    this.assertionService
      .generatePermissionLinks()
      .pipe(
        tap(() => (this.showLinksReportPendingMessage = true)),
        delay(10000),
        tap(() => (this.showLinksReportPendingMessage = false))
      )
      .subscribe(res => {});
  }

  generateCSV() {
    this.assertionService
      .generateCSV()
      .pipe(
        tap(() => (this.showEditReportPendingMessage = true)),
        delay(10000),
        tap(() => (this.showEditReportPendingMessage = false))
      )
      .subscribe(res => {});
  }

  generateReport() {
    this.assertionService
      .generateReport()
      .pipe(
        tap(() => (this.showStatusReportPendingMessage = true)),
        delay(10000),
        tap(() => (this.showStatusReportPendingMessage = false))
      )
      .subscribe(res => {});
  }

  resetSearch() {
    this.page = 1;
    this.searchTerm = '';
    this.submittedSearchTerm = '';
    this.loadAll();
  }

  submitSearch() {
    this.page = 1;
    this.submittedSearchTerm = this.searchTerm;
    this.loadAll();
  }

  protected paginateAssertions(data: IAssertion[], headers: HttpHeaders) {
    this.links = this.parseLinks.parse(headers.get('link'));
    this.totalItems = parseInt(headers.get('X-Total-Count'), 10);
    this.assertions = data;
    const first = (this.page - 1) * this.itemsPerPage === 0 ? 1 : (this.page - 1) * this.itemsPerPage + 1;
    const second = this.page * this.itemsPerPage < this.totalItems ? this.page * this.itemsPerPage : this.totalItems;
    this.paginationHeaderSubscription = this.translate
      .get('global.item-count.string', { first, second, total: this.totalItems })
      .subscribe(paginationHeader => (this.itemCount = paginationHeader));
  }

  protected onError(errorMessage: string) {
    this.jhiAlertService.error(errorMessage, null, null);
  }

  ngOnDestroy() {
    this.eventManager.destroy(this.eventSubscriber);
    this.routeData.unsubscribe();
    if (this.paginationHeaderSubscription) {
      this.paginationHeaderSubscription.unsubscribe();
    }
  }
}
