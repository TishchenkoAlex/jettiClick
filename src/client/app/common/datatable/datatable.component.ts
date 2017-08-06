import { Component, Input, ViewChild, OnInit } from '@angular/core';
import { ApiService } from './../../services/api.service';
import { Observable } from 'rxjs/Observable';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'common-datatable',
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.css']
})
// tslint:disable-next-line:class-name
export class commonDataTableComponent implements OnInit {

  @Input() docType;
  @Input() pageSize = 10;

  totalRecords = 0;
  selectedItem = {};
  filter = '';
  loading = true;
  items = [];
  cols = [];

  constructor(private docService: ApiService) {}

  ngOnInit() {

  }

  formatColumn(obj) {
    console.log(obj);
    return obj && typeof obj === 'object' ? obj.value : obj;
  }

}
