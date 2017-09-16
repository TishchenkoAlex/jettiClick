import { DataSource } from '@angular/cdk/collections';
import { MdPaginator, MdSort, PageEvent, Sort, SortDirection } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { merge } from 'rxjs/observable/merge';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

export class MdTableDataSource<T> implements DataSource<T> {
  private _renderDataChange = new BehaviorSubject<T[]>([]);

  private _orderedDataChange = new BehaviorSubject<T[]>([]);

  private _orderedDataChangeSubscription: Subscription | null = null;

  private _renderedDataChangeSubscription: Subscription | null = null;

  private _data: BehaviorSubject<T[]>;
  set data(data: T[]) { this._data.next(data); }
  get data() { return this._data.value; }

  set sort(sort: MdSort) {
    this._sort = sort;
    this._subscribeToOrderedDataChanges();
  }

  set paginator(paginator: MdPaginator) {
    this._paginator = paginator;
    this._subscribeToRenderedDataChanges();
  }

  public dataAccessor = (data: T, columnName: string): string | number => {
    const property: number | string = data[columnName];
    return isNaN(+property) ? property : +property;
  }

  constructor(initialData: T[] = [],
    private _sort: MdSort | null = null,
    private _paginator: MdPaginator | null = null) {
    this._data = new BehaviorSubject<T[]>(initialData);
    this._subscribeToOrderedDataChanges();
    this._subscribeToRenderedDataChanges();
  }

  _subscribeToOrderedDataChanges() {
    if (this._orderedDataChangeSubscription) {
      this._orderedDataChangeSubscription.unsubscribe();
      this._orderedDataChangeSubscription = null;
    }

    const orderedDataChanges: Subject<T[] | Sort>[] = [this._data];
    if (this._sort) { orderedDataChanges.push(this._sort.mdSortChange); }
    this._orderedDataChangeSubscription = merge(...orderedDataChanges).subscribe(() => {
      let orderedData = this.data.slice();
      if (this._sort) {
        orderedData = this._sortData(orderedData, this._sort.active, this._sort.direction);
      }
      this._orderedDataChange.next(orderedData);
    });
  }

  _subscribeToRenderedDataChanges() {
    if (this._renderedDataChangeSubscription) {
      this._renderedDataChangeSubscription.unsubscribe();
      this._renderedDataChangeSubscription = null;
    }

    const renderedDataChanges: Subject<T[] | PageEvent>[] = [this._orderedDataChange];
    if (this._paginator) { renderedDataChanges.push(this._paginator.page); }
    this._renderedDataChangeSubscription = merge(...renderedDataChanges).subscribe(() => {
      let pagedData = this._orderedDataChange.value.slice();

      if (this._paginator) {
        const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
        pagedData = pagedData.splice(startIndex, this._paginator.pageSize);
      }

      this._renderDataChange.next(pagedData);
    });
  }

  _sortData(data: T[], active: string, direction: SortDirection): T[] {
    if (!active || direction === '') { return data; }

    return data.sort((a, b) => {
      const valueA = this.dataAccessor(a, active);
      const valueB = this.dataAccessor(b, active);
      return (valueA < valueB ? -1 : 1) * (direction === 'asc' ? 1 : -1);
    });
  }

  connect() { return this._renderDataChange; }

  disconnect() { }
}
