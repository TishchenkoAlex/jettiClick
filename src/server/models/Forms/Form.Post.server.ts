import { PatchValue } from '../api';
import { FormPost } from './Form.Post';
import { ICallRequest } from '../../routes/utils/interfaces';

export default class FormPostServer extends FormPost {

  constructor (private CR: ICallRequest) {
    super(CR.formView as FormPost);
  }

  async Execute(): Promise<PatchValue> {
    return this.CR.formView;
  }
}

