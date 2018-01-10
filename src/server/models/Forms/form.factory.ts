import { FormBase } from './form';
import { FormTypes } from './form.types';
import { FormPost } from './Form.Post';


export interface IRegisteredForm<T extends FormBase> {
  type: FormTypes;
  class: T;
}

export function createForm(type: FormTypes) {
  const doc = RegisteredForms.find(el => el.type === type);
  if (doc) {
    const createInstance = <T extends FormBase>(c: new () => T): T => new c();
    const result = createInstance(doc.class);
    return result;
  }
}

export const RegisteredForms: IRegisteredForm<any>[] = [
  { type: 'Form.Form1', class: FormPost },
  { type: 'Form.Post', class: FormPost },
];


