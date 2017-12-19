import { DocumentOptions } from '../document';
import { createDocument, RegisteredDocument } from '../documents.factory';
import { buildTypesQueryList } from './Types.factory';

export class TypesDocument {

  QueryList(): string {
    const select = RegisteredDocument.filter(d => d.type.startsWith('Document.'))
      .map(el => ({ type: el.type, description: (createDocument(el.type).Prop() as DocumentOptions).description}));
    return buildTypesQueryList(select);
  }

}
