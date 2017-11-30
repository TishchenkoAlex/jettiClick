import { animate, Component, state, style, transition, trigger } from '@angular/core';
import { Auth0Service } from './auth/auth0.service';

@Component({
    selector: 'app-inline-profile',
    template: `
        <div *ngIf="(appAuth.userProfile$ | async) as userProfile">
        <div *ngIf="appAuth.isAuthenticated()">
        <div class="profile" [ngClass]="{'profile-expanded':active}">
            <a href="" (click)="onClick($event)">
                <img class="profile-image" src={{userProfile?.picture}} />
                <span class="profile-name">{{ userProfile?.nickname }}</span>
                <i class="fa fa-fw fa-caret-down"></i>
                <span class="profile-role">{{ userProfile?.name }}</span>
            </a>
        </div>
        </div>
        </div>
        <ul id="profile-menu" class="layout-menu" [@menu]="appAuth.isAuthenticated() ? 'hidden' : 'visible'">
        <li role="menuitem">
        <a style="cursor: pointer" (click)="appAuth.login()" [attr.tabindex]="!active ? '-1' : null">
            <i class="fa fa-fw fa-sign-out"></i>
            <span>Login</span>
        </a>
        <div class="layout-menu-tooltip">
            <div class="layout-menu-tooltip-arrow"></div>
            <div class="layout-menu-tooltip-text">Login</div>
        </div>
        </li>
        </ul>
        <ul id="profile-menu" class="layout-menu" [@menu]="active ? 'visible' : 'hidden'">
            <li role="menuitem">
                <a [attr.tabindex]="!active ? '-1' : null">
                    <i class="fa fa-fw fa-user"></i>
                    <span>Profile</span>
                </a>
                <div class="layout-menu-tooltip">
                    <div class="layout-menu-tooltip-arrow"></div>
                    <div class="layout-menu-tooltip-text">Profile</div>
                </div>
            </li>
            <li role="menuitem">
                <a [attr.tabindex]="!active ? '-1' : null">
                    <i class="fa fa-fw fa-user-secret"></i>
                    <span>Privacy</span>
                </a>
                <div class="layout-menu-tooltip">
                    <div class="layout-menu-tooltip-arrow"></div>
                    <div class="layout-menu-tooltip-text">Privacy</div>
                </div>
            </li>
            <li role="menuitem">
                <a [attr.tabindex]="!active ? '-1' : null">
                    <i class="fa fa-fw fa-cog"></i>
                    <span>Settings</span>
                </a>
                <div class="layout-menu-tooltip">
                    <div class="layout-menu-tooltip-arrow"></div>
                    <div class="layout-menu-tooltip-text">Settings</div>
                </div>
            </li>
            <li role="menuitem">
                <a (click)="appAuth.logout()" [attr.tabindex]="!active ? '-1' : null">
                    <i class="fa fa-fw fa-sign-out"></i>
                    <span>Logout</span>
                </a>
                <div class="layout-menu-tooltip">
                    <div class="layout-menu-tooltip-arrow"></div>
                    <div class="layout-menu-tooltip-text">Logout</div>
                </div>
            </li>
        </ul>
    `,
    animations: [
        trigger('menu', [
            state('hidden', style({
                height: '0px'
            })),
            state('visible', style({
                height: '*'
            })),
            transition('visible => hidden', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
            transition('hidden => visible', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
        ])
    ]
})
export class AppProfileComponent {

    active: boolean;
    constructor(public appAuth: Auth0Service) { }

    onClick(event) {
        this.active = !this.active;
        event.preventDefault();
    }
}
