import { ColumnDef } from '../../models/column';
import { PropOptions } from '../../models/document';
import { AllTypes } from '../../models/documents.types';
import { FormListFilter, FormListOrder, FormListSettings } from './../../models/user.settings';

export function buildColumnDef(view: { [x: string]: PropOptions; }, settings: FormListSettings): ColumnDef[] {

  const columnDef: ColumnDef[] = [];
  Object.keys(view).filter(property => view[property] && view[property]['type'] !== 'table').map((property) => {
    const prop: PropOptions = view[property];
    const hidden = !!prop['hiddenInList'] || !!prop['hidden'];
    const order = hidden ? -1 : prop['order']! * 1 || 999;
    const label = (prop['label'] || property.toString()).toLowerCase();
    const type: AllTypes | AllTypes[] = prop['type'] || 'string';
    const readOnly = !!prop['readOnly'];
    const required = !!prop['required'];
    const owner = prop['owner'] || null;
    const totals = prop['totals']! * 1;
    let value = prop['value'];
    let style = prop['style'];
    if (type === 'number' && !style) { style = { 'width': '100px', 'text-align': 'right' }; }
    if (type === 'boolean' && !style) { style = { 'width': '90px', 'text-align': 'center' }; }
    if (type === 'datetime' && !style) { style = { 'width': '135px', 'text-align': 'center' }; }
    if (type === 'enum') {
      value = [{label: '',  value: null}, ...(value || [] as string[]).map((el: any) => ({label: el, value: el}))];
      if (!style) style = { 'width': '170px' };
    }
    columnDef.push({
      field: property, type: type as string, label, hidden, order,
      style: style || { 'width': '200px', 'min-width': '200px', 'max-width': '200px'},
      required, readOnly, totals, owner: owner!,
      filter: settings.filter.find(f => f.left === property) || new FormListFilter(property),
      sort: settings.order.find(f => f.field === property) || new FormListOrder(property), value
    });
  });
  columnDef.filter(c => c.type === 'string').forEach(c => c.filter!.center = 'like');
  return columnDef.sort((a, b) => a.order - b.order);
}
