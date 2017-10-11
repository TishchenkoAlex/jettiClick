import { DocModel, JETTI_DOC_PROP } from '../doc.model';

export function mapDocToApiFormat(model: DocModel): DocModel {
  const newDoc: DocModel = {
    id: model.id,
    type: model.type,
    date: model.date,
    code: model.code,
    description: model.description,
    posted: model.posted,
    deleted: model.deleted,
    parent: model.parent,
    isfolder: model.isfolder,
    company: model.company['id'],
    user: model.user['id'],
    doc: {}
  };

  for (const property in model) {
    if (!model.hasOwnProperty(property)) { continue };
    if (JETTI_DOC_PROP.indexOf(property) > -1) { continue; }
    if ((model[property] instanceof Array)) {
      const copy = JSON.parse(JSON.stringify(model[property])) as any[];
      copy.forEach(element => {
        for (const p in element) {
          if (element.hasOwnProperty(p)) {
            let value = element[p];
            if (value && value['type'] && ((value['id'] === '') || (value['id'] === null))) { value = null; }
            element[p] = value ? value['id'] || value : value || null;
          }
        }
        delete element.index;
      });
      newDoc.doc[property] = copy;
    } else {
      let value = model[property];
/*       if (value && value['type'] === 'string') { value = value['value']}
      if (value && value['type'] === 'number') { value = value['value'] * 1 }
      if (value && value['type'] === 'boolean') { value = !!value['value'] }
      if (value && value['type'] === 'datetime') { value = new Date(value['value']) } */
      if (value && value['type'] && !value['value'] && ((value['id'] === '') || (value['id'] === null))) { value = null; }
      newDoc.doc[property] = value ? value['id'] || value : value || null;
    }
  }
  return newDoc;
}