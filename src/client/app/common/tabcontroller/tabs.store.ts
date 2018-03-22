import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export interface TabDef {
  header: string; icon: string; docType: string; docID: string; routerLink: string;
}

interface TabsState {
  selectedIndex: number;
  tabs: TabDef[];
}

const initailState: TabsState = {
  selectedIndex: 0,
  tabs: [{ header: 'Home', docType: 'home', icon: 'fa fa-home', docID: '', routerLink: '/' + 'home' }]
};

export class TabsStore {

  private readonly _state: BehaviorSubject<TabsState> = new BehaviorSubject(initailState);
  get state() { return this._state.value; }
  state$ = this._state.asObservable();

  get selectedIndex() { return this.state.selectedIndex; }
  set selectedIndex(value) {
    this._state.next(({
      ...this.state,
      selectedIndex: value
    }));
  }

  push(value: TabDef) {
    this._state.next(({
      ...this.state,
      tabs: [...this.state.tabs, value],
      selectedIndex: this.state.tabs.length
    }));
  }

  replace(value: TabDef) {
    const copy = [...this.state.tabs];
    const index = this.state.tabs.findIndex(el => el.docType === value.docType && el.docID === value.docID);
    copy[index] = value;
    this._state.next(({
      ...this.state,
      tabs: copy,
    }));
  }

  close(value: TabDef) {
    const copy = [...this.state.tabs];
    const index = this.state.tabs.findIndex(el => el.docType === value.docType && el.docID === value.docID);
    copy.splice(index, 1);
    this._state.next(({
      ...this.state,
      tabs: copy,
      selectedIndex: Math.min(index, copy.length - 1)
    }));
  }

}
