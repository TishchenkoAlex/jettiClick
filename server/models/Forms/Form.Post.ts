import { FormBase, JForm } from './form';
import { Props, Ref } from '../document';

@JForm({
  type: 'Form.Post',
  description: 'Post documents',
  icon: 'fa fa-money',
  menu: 'Post',
})
export class FormPost extends FormBase {

  @Props({ type: 'date', order: 3, required: true})
  StartDate = new Date();

  @Props({ type: 'date', order: 4, required: true})
  EndDate = new Date();

  @Props({ type: 'Catalog.Documents', order: 2, required: true})
  type = '';

  @Props({ type: 'Catalog.Company', order: 1, required: true})
  company: Ref = null;

  constructor (data: FormPost = {} as any) {
    super();
    this.StartDate = data.StartDate;
    this.EndDate = data.EndDate;
    this.type = data.type;
    this.company = data.company;
  }

}
