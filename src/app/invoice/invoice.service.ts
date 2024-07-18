import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ApiService } from '../shared/ApiService.service';
import { MainItem } from './invoice.model';
    
@Injectable()
export class InvoiceService {

    recordsChanged = new Subject<MainItem[]>();
    startedEditing = new Subject<number>();
    constructor(private apiService: ApiService) { }
    private recordsApi!: MainItem[]
  
    getRecords() {
      this.apiService.get<MainItem[]>('invoices').subscribe(response => {
        console.log(response);
        this.recordsApi = response;
        this.recordsChanged.next(this.recordsApi);
      });
    }
  
    getRecord(index: number): Observable<MainItem> {
      return this.apiService.getID<MainItem>('mainitems', index);
    }
   
    addRecord(record: MainItem) {
      this.apiService.post<MainItem>('mainitems', record).subscribe((response: MainItem) => {
        console.log('mainItem  created:', response);
        this.getRecords();
        return response
      });
    }
  
    updateRecord(index: number, newRecord: MainItem) {
      this.apiService.put<MainItem>('mainitems', index, newRecord).subscribe(response => {
        console.log('mainitem updated:',response);
        this.getRecords()
      });
    }
  
    deleteRecord(index: any) {
      this.apiService.delete<MainItem>('mainitems', index).subscribe(response => {
        console.log('mainitem deleted:',response);
        this.getRecords()
      });
    }

    getMainItemsWithSubItemsData() {
        return [
            {
                id: 1000,
                code: 'f230fh0g3',
                serviceNumber: 'Service 1',
                description: 'Service Description',
                quantity: 24,
                uom: 'KM',
                formula:'formula 1',
                amountPerUnit: 6500,
                currency: 'EGP',
                total: 20000,
                profitMargin: 5,
                totalWithProfit: 18000,
                selected: false,
                subItems: [
                    {
                        id: 1000-0,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 65000,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    },
                    {
                        id: 1000-1,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 6500,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    },
                    {
                        id: 1000-2,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 6500,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    },
                    {
                        id: 1000-3,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 6500,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    }
                ]
            },
            {
                id: 1001,
                code: 'f230fh0g3',
                serviceNumber: 'Service 1',
                description: 'Service Description',
                quantity: 24,
                uom: 'KM',
                formula:'formula 1',
                amountPerUnit: 6500,
                currency: 'EGP',
                total: 20000,
                profitMargin: 5,
                totalWithProfit: 18000,
                selected: false,
                subItems: [
                    {
                        id: 1000-0,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 65000,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    },
                    {
                        id: 1000-1,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 6500,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    },
                    {
                        id: 1000-2,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 6500,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    },
                    {
                        id: 1000-3,
                        mainCode: 'f230fh0g3',
                        serviceNumber: 'Service sub 1',
                        description: 'Service Description',
                        quantity: 24,
                        uom: 'KM',
                        formula:'formula 1',
                        amountPerUnit: 6500,
                        currency: 'EGP',
                        total: 20000,
                        selected: false
                    }
                ]
            },
           
           
        ];
    }

    getMainItemsWithSubItems() {
        return Promise.resolve(this.getMainItemsWithSubItemsData());
    }
};