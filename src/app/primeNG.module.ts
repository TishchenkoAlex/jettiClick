import locale from '@angular/common/locales/ru';
import { NgModule } from '@angular/core';
import { CovalentCodeEditorModule } from '@covalent/code-editor';
import { NgDragDropModule } from 'ng-drag-drop';
import { AutoCompleteModule } from 'primeng/components/autocomplete/autocomplete';
import { ButtonModule } from 'primeng/components/button/button';
import { CalendarModule } from 'primeng/components/calendar/calendar';
import { CheckboxModule } from 'primeng/components/checkbox/checkbox';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { MessageService } from 'primeng/components/common/messageservice';
import { ConfirmDialogModule } from 'primeng/components/confirmdialog/confirmdialog';
import { ContextMenuModule } from 'primeng/components/contextmenu/contextmenu';
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
// import { TableModule } from 'primeng/components/table/table';
import { TabViewModule } from 'primeng/components/tabview/tabview';
import { ToolbarModule } from 'primeng/components/toolbar/toolbar';
import { TooltipModule } from 'primeng/components/tooltip/tooltip';
import { TreeTableModule } from 'primeng/components/treetable/treetable';
import { TriStateCheckboxModule } from 'primeng/components/tristatecheckbox/tristatecheckbox';
import { TableModule } from './common/datatable/table';

@NgModule({
  exports: [
    // SharedModule,
    // DataTableModule,
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
    SelectButtonModule,
    InputTextModule,
    // ChipsModule,
    // DropdownModule,
    InputTextareaModule,
    // InputMaskModule,
    // PasswordModule,
    // ToggleButtonModule,
    CheckboxModule,
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
    // MultiSelectModule,
    // InplaceModule,
    // BlockUIModule,

    TableModule,
    TabViewModule,

    NgDragDropModule,
    CovalentCodeEditorModule
  ],
    providers: [ConfirmationService, MessageService]
})
export class PrimeNGModule { }

export const calendarLocale = {
  firstDayOfWeek: 1,
  dayNames: locale[3]![2],
  dayNamesShort: locale[3]![0],
  dayNamesMin: locale[3]![0],
  monthNames: locale[5]![2],
  monthNamesShort: locale[5]![1],
  today: 'Today',
  clear: 'Clear'
};

export const dateFormat = 'dd.mm.yy';
