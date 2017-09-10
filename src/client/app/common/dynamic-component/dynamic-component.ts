import { Component, Input, AfterViewInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
import { Directive, ViewContainerRef } from '@angular/core';
import { Type } from '@angular/core';

export interface DocumentComponent {
  data: any;
}

export class BaseDynamicCompoment {
  constructor(public component: Type<any>, public data: any) {}
}

@Directive({
  selector: '[component-host]',
})
export class DynamicComponentDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
  selector: 'dynamic-component',
  template: `<ng-template component-host></ng-template>`
})
export class DynamicComponent implements AfterViewInit {
  @Input() component: BaseDynamicCompoment;
  @ViewChild(DynamicComponentDirective) host: DynamicComponentDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) { }

  ngAfterViewInit() {
    Promise.resolve().then(() => this.loadComponent());
  }

  loadComponent() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component.component);
    const viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    (<DocumentComponent>componentRef.instance).data = this.component.data;
  }

}
