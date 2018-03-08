import { FormListFilter, FormListOrder } from './user.settings';

export interface ColumnDef {
    field: string;
    type: string;
    label: string;
    hidden: boolean;
    order: number;
    style: string | {[key: string]: any};
    required: boolean;
    readOnly: boolean;
    owner?: { dependsOn: string, filterBy: string };
    totals?: number;
    onChange?: Function;
    onChangeServer?: boolean;
    sort?: FormListOrder;
    filter?: FormListFilter;
    data?: any;
}
