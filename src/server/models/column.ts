import { FormListFilter, FormListOrder } from './user.settings';

export interface ColumnDef {
    field: string;
    type: string;
    label: string;
    hidden: boolean;
    order: number;
    style: string;
    required: boolean;
    readOnly: boolean;
    owner?: string;
    totals?: number;
    onChange?: Function;
    onChangeServer?: boolean;
    sort?: FormListOrder;
    filter?: FormListFilter;
    data?: any;
};
