import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  Directive,
  Input,
  OnInit,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { getFormComponent, getListComponent } from '../../UI/userForms';

export class BaseDynamicCompoment {
  constructor(public component: Type<any>) { }
}

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[component-host]',
})
export class DynamicComponentDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dynamic-component',
  template: `<ng-template component-host></ng-template>`,
})
export class DynamicComponent implements OnInit, AfterViewInit {
  @Input() type;
  @Input() kind: 'list' | 'form';
  component: BaseDynamicCompoment;

  @ViewChild(DynamicComponentDirective) host: DynamicComponentDirective;

  constructor(private componentFactoryResolver: ComponentFactoryResolver, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.component = this.kind === 'list' ?
      new BaseDynamicCompoment(getListComponent(this.type)) :
      new BaseDynamicCompoment(getFormComponent(this.type));
  }

  ngAfterViewInit() {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.component.component);
    const viewContainerRef = this.host.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    this.cd.detectChanges();
  }

}
