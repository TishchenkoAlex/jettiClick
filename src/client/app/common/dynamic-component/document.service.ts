import { Injectable, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DocModel } from '../_doc.model';
import { ViewModel } from '../dynamic-form/dynamic-form.service';

@Injectable()
export class DocumentService implements OnDestroy {

  private viewModel: ViewModel;
  constructor(private api: ApiService, private route: ActivatedRoute) {
    this.viewModel = route.data['value']['detail'];
    console.log('DOCSERVICE INIT', this.viewModel)
  }

  ngOnDestroy() {
    console.log('DOCSERVICE DESTROY', this.viewModel)
  }

  Post(viewModel: ViewModel) {
    console.log('POST');
    const formDoc = viewModel.formGroup.value;
    const newDoc: DocModel = {
      id: viewModel.model.id,
      type: viewModel.model.type,
      date: formDoc.date,
      code: formDoc.code,
      description: formDoc.description || viewModel.model.description,
      posted: true,
      deleted: false,
      parent: '',
      isfolder: false,
      doc: {}
    }

    const exclude = ['id', 'code', 'type', 'posted', 'deleted', 'isfolder', 'parent', 'date', 'description'];

    const process = (s, d) => {
      for (const property in s) {
        if (exclude.indexOf(property) > -1) { continue; }
        if (s[property] && typeof s[property] === 'object') {
          if (s[property].constructor === Array) {
            //
          } else {
            d.doc[property] = s[property]['id'] || null;
          }
        } else {
          d.doc[property] = s[property];
        }
      }
    }
    process(formDoc, newDoc);
    if (!newDoc.date) { newDoc.date = new Date(); }
    this.api.postDoc(newDoc)
      .share()
      .subscribe((posted: DocModel) => {
        viewModel.model = posted;
        viewModel.formGroup.patchValue(posted);
      });
  }

}
