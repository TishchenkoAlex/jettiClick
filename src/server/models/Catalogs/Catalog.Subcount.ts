import { AllTypes } from '../documents.types';
import { JDocument, DocumentBase, Props, Ref } from './../document';

@JDocument({
  type: 'Catalog.Subcount',
  description: 'Субконко',
  icon: '',
  menu: 'Субконто',
  prefix: null
})
export class CatalogSubcount extends DocumentBase {
  @Props({ type: 'Catalog.Subcount', hiddenInList: true, order: -1 })
  parent: Ref = null;

  QueryList() {
    return `
      SELECT * FROM (SELECT
        d.type id,
        'Catalog.Subcount'::TEXT as "type",
        type code,
        description,
        now() as date,
        true posted,
        false deleted,
        null parent
      FROM config_schema d
      WHERE chapter IN ('Document', 'Catalog', 'type')) d
      WHERE TRUE `;
  }

}
