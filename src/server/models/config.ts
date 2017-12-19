import { SQLGenegator } from '../fuctions/SQLGenerator';
import { CatalogSubcount } from './../models/Catalogs/Catalog.Subcount';
import { DocumentOperation } from './../models/Documents/Document.Operation';
import { DocumentOptions } from './document';
import { createDocument, RegisteredDocument } from './documents.factory';
import { AllDocTypes, AllTypes, ComplexTypes, DocumentTypes } from './documents.types';
import { createTypes, RegisteredTypes } from './Types/Types.factory';

export interface IConfigSchema {
  type: AllDocTypes,
  description?: string,
  icon?: string,
  menu?: string,
  prefix?: string,
  QueryObject?: string,
  QueryList: string,
  QueryNew?: string,
  dimensions?: { [x: string]: AllTypes }[],
  Props?: { [x: string]: any },
  Prop?: DocumentOptions
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
      QueryObject: SQLGenegator.QueryObject(Props, Prop),
      QueryList: SQLGenegator.QueryList(Props, Prop),
      QueryNew: SQLGenegator.QueryNew(Props, Prop),
      Props: Props,
      Prop: Prop
    });
    console.log('Building config schema...', el.type);
    if (el.type === 'Catalog.Subcount') { result.QueryList = (doc as CatalogSubcount).QueryList() }
    if (el.type === 'Document.Operation') { // Opeations specific implementation
      result.QueryList = (doc as DocumentOperation).QueryList();
      result.QueryObject = (doc as DocumentOperation).QueryObject();
      result.QueryNew = (doc as DocumentOperation).QueryNew();
    }
    return result;
  }),
  ...RegisteredTypes.map(el => {
    const doc = createTypes(el.type as ComplexTypes);
    const result: IConfigSchema = {
      type: el.type as DocumentTypes,
      QueryList: doc.QueryList()
    }
    console.log('Building config schema...', el.type)
    return ({
      type: el.type as ComplexTypes,
      QueryList: doc.QueryList()
    })
  })]
  .map((i): [AllDocTypes, IConfigSchema] => [i.type, i]));
