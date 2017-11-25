import { DocModel } from '../modules/doc.base';

function createInstance<A extends DocModel>(c: new () => A): A {
    return new c();
}
