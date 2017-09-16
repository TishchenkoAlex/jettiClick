import { Injectable, TemplateRef } from '@angular/core';

@Injectable()
export class SideNavService {
    public templateRef: TemplateRef<any>;

    constructor() { }
}
