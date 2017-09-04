import { Component, Input, AfterViewInit, ViewChild, ComponentFactoryResolver, OnDestroy } from '@angular/core';

import { DynamicComponentDirective } from './dynamic-component.directive';
import { BaseDynamicCompoment } from './dynamic-base.component';
import { DocumentComponent } from './document.component';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'dynamic-component',
  template: `<ng-template component-host></ng-template>`
})
export class DynamicComponent implements AfterViewInit {
  @Input() component: BaseDynamicCompoment;
  @ViewChild(DynamicComponentDirective) adHost: DynamicComponentDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngAfterViewInit() {
    setTimeout(() => this.loadComponent());
  }

  loadComponent() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component.component);
    const viewContainerRef = this.adHost.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<DocumentComponent>componentRef.instance).data = this.component.data;
  }

}
