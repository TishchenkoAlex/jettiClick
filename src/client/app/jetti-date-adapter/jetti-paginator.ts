import { MdPaginatorIntl } from '@angular/material';

const russianRangeLabel = (page: number, pageSize: number, length: number) => {
    if (length === 0 || pageSize === 0) { return `0 of ${length}`; }

    length = Math.max(length, 0);

    const startIndex = page * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;

    return `${startIndex + 1} - ${endIndex}`;
}

export function getJettiPaginatorIntl() {
    const paginatorIntl = new MdPaginatorIntl();

    paginatorIntl.itemsPerPageLabel = 'page size';
    paginatorIntl.nextPageLabel = 'next page';
    paginatorIntl.previousPageLabel = 'prev page';
    paginatorIntl.getRangeLabel = russianRangeLabel;

    return paginatorIntl;
}
