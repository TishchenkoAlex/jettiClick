import { db, TX } from '../db';
import { DocumentBase, Ref } from './document';
import { PostResult } from './post.interfaces';
import { PatchValue, RefValue } from '../std.lib';

export interface IServerDocument {
  id: Ref;
  date: Date,
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

  beforePost(tx: TX): Promise<void> {
    throw new Error('Method not implemented.');
  }
  onPost(tx: TX): Promise<PostResult> {
    throw new Error('Method not implemented.');
  }
  afterPost(tx: TX): Promise<void> {
    throw new Error('Method not implemented.');
  }
  beforeDelete(tx: TX): Promise<void> {
    throw new Error('Method not implemented.');
  }
  afterDelete(tx: TX): Promise<void> {
    throw new Error('Method not implemented.');
  }
  onValueChanged?(prop: string, value: any, tx: TX): Promise<PatchValue> {
    throw new Error('Method not implemented.');
  }
  onCommand(command: string, args: any, tx: TX): Promise<any> {
    throw new Error('Method not implemented.');
  }

}

export interface ServerDocument {
  beforePost?(tx: TX): Promise<void>;
  onPost?(tx: TX): Promise<PostResult>;
  afterPost?(tx: TX): Promise<void>;

  beforeDelete?(tx: TX): Promise<void>;
  afterDelete?(tx: TX): Promise<void>;

  onValueChanged?(prop: string, value: any, tx: TX): Promise<PatchValue>;
  onCommand?(command: string, args: any, tx: TX): Promise<any>;
}
