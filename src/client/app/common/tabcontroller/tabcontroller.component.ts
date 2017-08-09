import { Router, ActivatedRoute, ParamMap } from '@angular/router/';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-tabcontroller',
  templateUrl: './tabcontroller.component.html',
  styleUrls: ['./tabcontroller.component.scss']
})
export class TabControllerComponent implements OnInit {
  index = 0;
  tabs: {closable: boolean, header: string}[] = [{closable: false, header: 'Home'}];

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.paramMap
      .subscribe((params: ParamMap) =>  {
        const tabid = params.get('id') || 'Home';
        const index = this.tabs.findIndex(i => i.header === tabid);
        if (index === -1) {
          console.log('tabid', tabid);
          const newTab = {closable: true, header: tabid};
          const lastTabIndex = this.tabs.push(newTab);
            setTimeout(() => this.index = lastTabIndex - 1)
        } else {
          this.index = index;
        }
      });
  }

  handleClose(event) {
    this.tabs.splice(event.index, 1);
    const tab = this.tabs[event.index - 1].header;
    this.router.navigateByUrl(tab);
  }

  onChange(event) {
    const tab = this.tabs[event.index].header;
    this.router.navigateByUrl(tab);
  }
}
