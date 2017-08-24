import { Type } from '@angular/core';

export class BaseDynamicCompoment {
  constructor(public component: Type<any>, public data: any) {}
}
