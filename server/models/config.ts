import { SQLGenegator } from '../fuctions/SQLGenerator.MSSQL';
import { CatalogSubcount } from './../models/Catalogs/Catalog.Subcount';
import { CatalogDocuments } from './Catalogs/Catalog.Documents';
import { RegisteredTypes, createTypes } from './Types/Types.factory';
import { DocumentBase, DocumentOptions } from './document';
import { RegisteredDocument, createDocument } from './documents.factory';
import { AllDocTypes, AllTypes, ComplexTypes, DocTypes, DocumentTypes } from './documents.types';

export interface IConfigSchema {
  type: AllDocTypes;
  description?: string;
  icon?: string;
  menu?: string;
  prefix?: string;
  QueryObject?: string;
  QueryList: string;
  dimensions?: { [x: string]: AllTypes }[];
  copyTo?: DocTypes[];
  Props?: { [x: string]: any };
  Prop?: DocumentOptions;
  doc?: DocumentBase;
}

export const configSchema = new Map([
  ...RegisteredDocument.map(el => {
    const doc = createDocument(el.type);
    const Prop = doc.Prop() as DocumentOptions;
    const Props = doc.Props();
    const result: IConfigSchema = ({
      type: el.type,
      description: Prop.description,
      icon: Prop.icon,
      menu: Prop.menu,
      prefix: Prop.prefix,
      dimensions: Prop.dimensions,
      QueryObject: SQLGenegator.QueryObject(Props, el.type),
      QueryList: SQLGenegator.QueryList(Props, el.type),
      Props: Props,
      Prop: Prop,
      copyTo: Prop.copyTo,
      doc: doc
    });
    if (el.type === 'Catalog.Subcount') { result.QueryList = (doc as CatalogSubcount).QueryList(); }
    if (el.type === 'Catalog.Documents') { result.QueryList = (doc as CatalogDocuments).QueryList(); }
    return result;
  }),
  ...RegisteredTypes.map(el => {
    const doc = createTypes(el.type as ComplexTypes);
    const fakeDoc = new DocumentBase(); fakeDoc.type = el.type as any;
    const result: IConfigSchema = {
      type: el.type as DocumentTypes,
      QueryList: doc.QueryList(),
      Props: fakeDoc.Props()
    };
    return ({
      type: el.type as ComplexTypes,
      QueryList: doc.QueryList(),
      Props: fakeDoc.Props()
    });
  })]
  .map((i): [AllDocTypes, IConfigSchema] => [i.type, i]));
