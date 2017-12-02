import { ColumnDef } from '../../models/column';
import { FormListFilter, FormListOrder, FormListSettings } from './../../models/user.settings';

export function buildColumnDef(view, settings: FormListSettings): ColumnDef[] {

  const columnDef: ColumnDef[] = [];
  Object.keys(view).filter(property => view[property] && view[property]['type'] !== 'table').map((property) => {
    const prop = view[property];
    const hidden = !!prop['hidden-list'];
    const order = hidden ? 1000 : prop['order'] * 1 || 999;
    const label = (prop['label'] || property.toString()).toLowerCase();
    const type = prop['type'] || 'string';
    const readOnly = !!prop['readOnly'];
    const required = !!prop['required'];
    const owner = prop['owner'] || '';
    const totals = prop['totals'] * 1 || null;
    let style = prop['style'] || '';
    if (type === 'number' && !style) { style = { 'width': '90px', 'text-align': 'right' } }
    if (type === 'boolean' && !style) { style = { 'width': '90px', 'text-align': 'center' } }
    if (type === 'datetime' && !style) { style = { 'width': '120px', 'text-align': 'center' } }
    if (type === 'date' && !style) { style = { 'width': '90px', 'text-align': 'center' } }
    columnDef.push({
      field: property, type: type, label: label, hidden: hidden, order: order, style: style,
      required: required, readOnly: readOnly, totals: totals, owner: owner,
      filter: settings.filter.find(f => f.left === property) || new FormListFilter(property),
      sort: settings.order.find(f => f.field === property) || new FormListOrder(property)
    });
  });
  columnDef.filter(c => c.type === 'string').forEach(c => c.filter.center = 'like');
  columnDef.sort((a, b) => a.order - b.order);
  return columnDef;
}
