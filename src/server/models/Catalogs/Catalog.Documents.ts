import { AllTypes, DocTypes } from '../documents.types';
import { createDocument, RegisteredDocument } from './../../models/documents.factory';
import { DocumentBase, DocumentOptions, JDocument, Props, Ref } from './../document';
import { buildSubcountQueryList } from './../../fuctions/SQLGenerator.MSSQL';

@JDocument({
  type: 'Catalog.Documents',
  description: 'Documents types',
  icon: '',
  menu: 'Documents types',
  prefix: null
})
export class CatalogDocuments extends DocumentBase {
  @Props({ type: 'Catalog.Documents', hiddenInList: true, order: -1 })
  parent: Ref = null;


  QueryList() {
    const select = RegisteredDocument.filter(el => el.type.startsWith('Document.'))
      .map(el => ({ type: el.type as DocTypes, description: (<DocumentOptions>(createDocument(el.type).Prop())).description }));

    return buildSubcountQueryList(select);
  }

}
