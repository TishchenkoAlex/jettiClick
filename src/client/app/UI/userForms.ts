import { BaseDocListComponent } from '../common/datatable/base.list.component';
import { BaseDocFormComponent } from '../common/form/base.form.component';
import { BaseFormComponent } from './../common/forms/base.form.component';
import { OperationFormComponent } from './Operation/operation.form.component';
import { OperationListComponent } from './Operation/operation.list.component';

export function getDocListComponent(type: string) {
  const result = userForms.find(data => data.type === type);
  return result ? result.listForm : BaseDocListComponent;
}

export function getFormComponent(type: string) {
  const result = userForms.find(data => data.type === type);
  return result ? result.docForm : BaseFormComponent;
}


export function getDocObjectComponent(type: string) {
  const result = userForms.find((data) => data.type === type);
  return result ? result.docForm : BaseDocFormComponent;
}

const userForms = [
  { type: 'Document.Operation', docForm: OperationFormComponent, listForm: OperationListComponent },
  // add user's defined component for list- or doc-Form here
]
