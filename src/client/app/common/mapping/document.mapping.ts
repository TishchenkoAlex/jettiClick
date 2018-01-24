import { DocumentBase } from './../../../../server/models/document';
import { INoSqlDocument } from './../../../../server/models/ServerDocument';

export function mapDocToApiFormat(model: DocumentBase): INoSqlDocument {
  const newDoc: INoSqlDocument = {
    id: model.id,
    type: model.type,
    date: model.date,
    code: model.code,
    description: model.description,
    posted: model.posted,
    deleted: model.deleted,
    parent: model.parent['id'],
    isfolder: model.isfolder,
    company: model.company['id'],
    user: model.user['id'],
    info: model.info,
    timestamp: model.timestamp,
    doc: {}
  };

  const JETTI_DOC_PROP = Object.keys(newDoc);

  for (const property in model) {
    if (!model.hasOwnProperty(property)) { continue; }
    if (JETTI_DOC_PROP.indexOf(property) > -1) { continue; }
    if ((model[property] instanceof Array)) {
      const copy = JSON.parse(JSON.stringify(model[property])) as any[];
      copy.forEach(element => {
        for (const p in element) {
          if (element.hasOwnProperty(p)) {
            let value = element[p];
            if (value && value['type'] &&
              ['string', 'number', 'boolean', 'datetime'].includes(value['type'])) {
              value['id'] = null; element[p] = value; continue;
            }
            if (value && value['type'] && !value['value'] && ((value['id'] === '') || (value['id'] === null))) { value = null; }
            element[p] = value ? value['id'] || value : value || null;
          }
        }
        delete element.index;
      });
      newDoc.doc[property] = copy;
    } else {
      let value = model[property];
      if (value && value['type'] &&
        ['string', 'number', 'boolean', 'datetime'].includes(value['type'])) {
        value['id'] = null; newDoc.doc[property] = value; continue;
      }
      if (value && value['type'] && !value['value'] && ((value['id'] === '') || (value['id'] === null))) { value = null; }
      newDoc.doc[property] = value ? value['id'] || value : value || null;
    }
  }
  return newDoc;
}
