import { Component } from '@angular/core';

interface PBData { accessToken: string, embedUrl: string, type: string, id: string }

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    reportData: PBData =  {
    accessToken: 'H4sIAAAAAAAEAB2WtQ70CBKE3',
    embedUrl: 'https://app.powerbi.com/reportEmbed?reportId=bd851208e',
    type: 'report',
    id: 'bd851208e',
  };

 }
