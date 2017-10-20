import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, Input, ViewChild } from '@angular/core';
import { Directive, ViewContainerRef } from '@angular/core';
import { ChangeDetectionStrategy, Type } from '@angular/core';

export class BaseDynamicCompoment {
  constructor(public component: Type<any>) {}
}

@Directive({
  selector: '[component-host]',
})
export class DynamicComponentDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dynamic-component',
  template: `<ng-template component-host></ng-template>`
})
export class DynamicComponent implements AfterViewInit {
  @Input() component: BaseDynamicCompoment;
  @ViewChild(DynamicComponentDirective) host: DynamicComponentDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef) { }

  ngAfterViewInit() {
    this.loadComponent();
  }

  loadComponent() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component.component);
    const viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    this.cd.detectChanges();
  }
}
