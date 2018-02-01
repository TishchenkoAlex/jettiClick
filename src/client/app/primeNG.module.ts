import locale from '@angular/common/locales/ru';
import { NgModule } from '@angular/core';
import { NgDragDropModule } from 'ng-drag-drop';
import { AutoCompleteModule } from 'primeng/components/autocomplete/autocomplete';
import { ButtonModule } from 'primeng/components/button/button';
import { CalendarModule } from 'primeng/components/calendar/calendar';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { MessageService } from 'primeng/components/common/messageservice';
import { ConfirmDialogModule } from 'primeng/components/confirmdialog/confirmdialog';
import { ContextMenuModule } from 'primeng/components/contextmenu/contextmenu';
import { DataTableModule } from 'primeng/components/datatable/datatable';
import { DialogModule } from 'primeng/components/dialog/dialog';
import { FieldsetModule } from 'primeng/components/fieldset/fieldset';
import { GrowlModule } from 'primeng/components/growl/growl';
import { InputTextModule } from 'primeng/components/inputtext/inputtext';
import { InputTextareaModule } from 'primeng/components/inputtextarea/inputtextarea';
import { PaginatorModule } from 'primeng/components/paginator/paginator';
import { PanelModule } from 'primeng/components/panel/panel';
import { ProgressBarModule } from 'primeng/components/progressbar/progressbar';
import { ProgressSpinnerModule } from 'primeng/components/progressspinner/progressspinner';
import { SelectButtonModule } from 'primeng/components/selectbutton/selectbutton';
import { SpinnerModule } from 'primeng/components/spinner/spinner';
import { SplitButtonModule } from 'primeng/components/splitbutton/splitbutton';
import { ToolbarModule } from 'primeng/components/toolbar/toolbar';
import { TooltipModule } from 'primeng/components/tooltip/tooltip';
import { TreeTableModule } from 'primeng/components/treetable/treetable';
import { TabViewModule } from 'primeng/components/tabview/tabview';
import { TableModule } from 'primeng/components/table/table';
import { TriStateCheckboxModule } from 'primeng/components/tristatecheckbox/tristatecheckbox';

// import { TableModule } from './common/datatable/table';

@NgModule({
  exports: [
    // SharedModule,
    DataTableModule,
    AutoCompleteModule,
    CalendarModule,
    ButtonModule,
    SplitButtonModule,
    SpinnerModule,
    ConfirmDialogModule,
    DialogModule,
    // SidebarModule,
    TooltipModule,
    // AccordionModule,
    FieldsetModule,
    // MessagesModule,
    // MessageModule,
    GrowlModule,
    TreeTableModule,
    // CheckboxModule,
    SelectButtonModule,
    InputTextModule,
    // ChipsModule,
    // DropdownModule,
    InputTextareaModule,
    // InputMaskModule,
    // PasswordModule,
    // ToggleButtonModule,
    TriStateCheckboxModule,
    // RadioButtonModule,
    PaginatorModule,
    ToolbarModule,
    PanelModule,
    // MenuModule,
    ContextMenuModule,
    // PanelMenuModule,
    // TabMenuModule,
    // MegaMenuModule,
    // SlideMenuModule,
    // BreadcrumbModule,
    // TieredMenuModule,
    // StepsModule,
    // DragDropModule,
    ProgressBarModule,
    ProgressSpinnerModule,
    //  MultiSelectModule,
    // InplaceModule,
    // BlockUIModule,

    TableModule,
    TabViewModule,

    NgDragDropModule
  ],
    providers: [ConfirmationService, MessageService]
})
export class PrimeNGModule { }

export const calendarLocale = {
  firstDayOfWeek: 1,
  dayNames: locale[3][2],
  dayNamesShort: locale[3][0],
  dayNamesMin: locale[3][0],
  monthNames: locale[5][2],
  monthNamesShort: locale[5][1],
  today: 'Today',
  clear: 'Clear'
};

export const dateFormat = 'dd.mm.yy';
