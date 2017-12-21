import { FormBase, JForm } from './form';
import { Props } from '../document';

@JForm({
  type: 'Form.Post',
  description: 'Post documents',
  icon: 'fa fa-money',
  menu: 'Post',
})
export class FormPost extends FormBase {

  @Props({ type: 'string', order: 1, required: true})
  code = '';

  constructor (data: FormPost = {} as any) {
    super();
    this.code = data.code;
  }

}
