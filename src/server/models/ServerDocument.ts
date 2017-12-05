import { DocumentBase, Ref } from './document';
import { PostResult } from './post.interfaces';
import { TX, db } from '../db';
import { PatchValue } from '../modules/doc.base';


export interface IServerDocument {
  id: Ref;
  date: string,
  type: string;
  code: string;
  description: string;
  company: Ref;
  user: Ref;
  posted: boolean;
  deleted: boolean;
  isfolder: boolean;
  parent: Ref;
  info: string;
  doc: { [x: string]: any }
}

export abstract class DocumentBaseServer extends DocumentBase implements ServerDocument {

  map(document: IServerDocument) {
    throw new Error('Method not implemented.');
  }

  onPost(Registers: PostResult, tx: TX = db): Promise<void> {
    throw new Error('Method not implemented.');
  }
  onValueChanged(prop: string, value: any, tx: TX = db): Promise<PatchValue> {
    throw new Error('Method not implemented.');
  }

}

export interface ServerDocument {
  onPost(Registers: PostResult, tx?: TX): Promise<void>;
  onValueChanged(prop: string, value: any, tx?: TX): Promise<PatchValue>;
  map(document: IServerDocument);
}
