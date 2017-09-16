import { Observable } from 'rxjs/Observable';
import { ApiService } from '../../services/api.service';
import { OnInit, OnDestroy, Component, Input } from '@angular/core';

@Component({
    selector: 'j-register-movement',
    styleUrls: ['./register-movement.component.scss'],
    templateUrl: './register-movement.component.html',
})
export class RegisterMovementComponent implements OnInit, OnDestroy {

    @Input() docID: string;
    movements$: Observable<any[]>;

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        this.movements$ = this.apiService.getDocAccountMovementsView(this.docID).take(1);
    }

    ngOnDestroy() {

    }
}
