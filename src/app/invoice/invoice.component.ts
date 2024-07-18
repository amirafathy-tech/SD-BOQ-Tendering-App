
import { Component } from '@angular/core';
import * as FileSaver from 'file-saver';

import { ConfirmationService, MessageService } from 'primeng/api';
import { InvoiceService } from './invoice.service';
import { MainItem, SubItem } from './invoice.model';
import { ApiService } from '../shared/ApiService.service';
import { ServiceMaster } from '../models/service-master.model';
import { UnitOfMeasure } from '../models/unitOfMeasure.model';
import { Formula } from '../models/formulas.model';

@Component({
  selector: 'app-invoice-test',
  templateUrl: './invoice.component.html',
  styleUrls: ['./invoice.component.css'],
  providers: [MessageService, InvoiceService, ConfirmationService]
})
export class InvoiceComponent {

  currency: any
  totalValue: number = 0.0
  //fields for dropdown lists
  recordsServiceNumber!: ServiceMaster[];
  selectedServiceNumberRecord?: ServiceMaster
  selectedServiceNumber!: number;
  updateSelectedServiceNumber!: number
  updateSelectedServiceNumberRecord?: ServiceMaster
  shortText: string = '';
  updateShortText: string = '';
  shortTextChangeAllowed: boolean = false;
  updateShortTextChangeAllowed: boolean = false;

  recordsFormula!: any[];
  selectedFormula!: string;
  selectedFormulaRecord: any
  updatedFormula!: number;
  updatedFormulaRecord: any

  recordsUnitOfMeasure: UnitOfMeasure[] = [];
  selectedUnitOfMeasure!: string;

  recordsCurrency!: any[];
  selectedCurrency!: string;
  //
  selectedRowsForProfit: MainItem[] = []; // Array to store selected rows
  profitMarginValue: number = 0;

  public rowIndex = 0;
  expandedRows: { [key: number]: boolean } = {};
  mainItemsRecords: MainItem[] = [];
  subItemsRecords: SubItem[] = [];

  updateProfitMargin(value: number) {
    for (const row of this.selectedRowsForProfit) {
      row.profitMargin = value;
      const { mainItemCode, total, totalWithProfit, ...mainItemWithoutMainItemCode } = row;
      const updatedMainItem = this.removePropertiesFrom(mainItemWithoutMainItemCode, ['mainItemCode', 'subItemCode']);
      console.log(updatedMainItem);

      const newRecord: MainItem = {
        ...updatedMainItem, // Copy all properties from the original record
        // Modify specific attributes
        subItems: (row?.subItems ?? []).map(subItem =>
          this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
        ),
        profitMargin: value

      };
      console.log(newRecord);
      const updatedRecord = this.removeProperties(newRecord, ['selected'])


      this._ApiService.patch<MainItem>('mainitems', row.mainItemCode, updatedRecord).subscribe(response => {
        console.log('mainitem updated :', response);
        this.totalValue = 0;
        this.ngOnInit();
      });

    }
  }


  constructor(private _ApiService: ApiService, private _InvoiceService: InvoiceService, private messageService: MessageService, private confirmationService: ConfirmationService) { }

  ngOnInit() {

    this._ApiService.get<ServiceMaster[]>('servicenumbers').subscribe(response => {
      this.recordsServiceNumber = response
      //.filter(record => record.deletionIndicator === false);
    });
    this._ApiService.get<any[]>('formulas').subscribe(response => {
      this.recordsFormula = response;
    });
    this._ApiService.get<any[]>('currencies').subscribe(response => {
      this.recordsCurrency = response;
    });
    this._ApiService.get<MainItem[]>('mainitems').subscribe(response => {
      this.mainItemsRecords = response.sort((a, b) => b.mainItemCode - a.mainItemCode);
      console.log(this.mainItemsRecords);

      this.totalValue = this.mainItemsRecords.reduce((sum, record) => sum + record.totalWithProfit, 0);
      console.log('Total Value:', this.totalValue);
    });
    this._ApiService.get<SubItem[]>('subitems').subscribe(response => {
      this.subItemsRecords = response;
    });
  }
  // Helper Functions:
  removePropertiesFrom(obj: any, propertiesToRemove: string[]): any {
    const newObj: any = {};

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (Array.isArray(obj[key])) {
          // If the property is an array, recursively remove properties from each element
          newObj[key] = obj[key].map((item: any) => this.removeProperties(item, propertiesToRemove));
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          // If the property is an object, recursively remove properties from the object
          newObj[key] = this.removeProperties(obj[key], propertiesToRemove);
        } else if (!propertiesToRemove.includes(key)) {
          // Otherwise, copy the property if it's not in the list to remove
          newObj[key] = obj[key];
        }
      }
    }

    return newObj;
  }
  removeProperties(obj: any, propertiesToRemove: string[]): any {
    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      if (!propertiesToRemove.includes(key)) {
        newObj[key] = obj[key];
      }
    });
    return newObj;
  }
  // to handel checkbox selection:
  selectedMainItems: MainItem[] = [];
  selectedSubItems: SubItem[] = [];
  onMainItemSelection(event: any, mainItem: MainItem) {
    mainItem.selected = event.checked;
    this.selectedMainItems = event.checked
    if (mainItem.selected) {
      if (mainItem.subItems && mainItem.subItems.length > 0) {
        mainItem.subItems.forEach(subItem => subItem.selected = !subItem.selected);
      }
    }
    else {
      // User deselected the record, so we need to deselect all associated subitems
      if (mainItem.subItems && mainItem.subItems.length > 0) {
        mainItem.subItems.forEach(subItem => subItem.selected = false)
        console.log(mainItem.subItems);
      }
    }
    // For Profit Margin:
    if (event.checked) {
      this.selectedRowsForProfit.push(mainItem);
      console.log(this.selectedRowsForProfit);

    } else {
      const index = this.selectedRowsForProfit.indexOf(mainItem);
      if (index !== -1) {
        this.selectedRowsForProfit.splice(index, 1);
        console.log(this.selectedRowsForProfit);
      }
    }
  }
  // to handle All Records Selection / Deselection 
  selectedAllRecords: MainItem[] = [];
  onSelectAllRecords(event: any): void {
    if (Array.isArray(event.checked) && event.checked.length > 0) {
      this.selectedAllRecords = [...this.mainItemsRecords];
      console.log(this.selectedAllRecords);
    } else {
      this.selectedAllRecords = [];
    }
  }

  onSubItemSelection(event: any, subItem: SubItem) {
    console.log(subItem);
    this.selectedSubItems.push(subItem);
  }
  //In Creation to handle shortTextChangeAlowlled Flag 
  onServiceNumberChange(event: any) {
    const selectedRecord = this.recordsServiceNumber.find(record => record.serviceNumberCode === this.selectedServiceNumber);
    if (selectedRecord) {
      this.selectedServiceNumberRecord = selectedRecord
      this.shortTextChangeAllowed = this.selectedServiceNumberRecord?.shortTextChangeAllowed || false;
      this.shortText = ""
    }
    else {
      console.log("no service number");
      //this.dontSelectServiceNumber = false
      this.selectedServiceNumberRecord = undefined;
    }
  }
  //In Update to handle shortTextChangeAlowlled Flag 
  onServiceNumberUpdateChange(event: any) {
    const updateSelectedRecord = this.recordsServiceNumber.find(record => record.serviceNumberCode === event.value);
    if (updateSelectedRecord) {
      this.updateSelectedServiceNumberRecord = updateSelectedRecord
      this.updateShortTextChangeAllowed = this.updateSelectedServiceNumberRecord?.shortTextChangeAllowed || false;
      this.updateShortText = ""
    }
    else {
      this.updateSelectedServiceNumberRecord = undefined;
    }
  }
  onFormulaSelect(event: any) {
    const selectedRecord = this.recordsFormula.find(record => record.formula === this.selectedFormula);
    if (selectedRecord) {
      this.selectedFormulaRecord = selectedRecord
      console.log(this.selectedFormulaRecord);

    }
    else {
      console.log("no Formula");
      this.selectedFormulaRecord = undefined;
    }
  }
  onFormulaUpdateSelect(event: any) {
    const selectedRecord = this.recordsFormula.find(record => record.formula === event.value);
    if (selectedRecord) {
      this.updatedFormulaRecord = selectedRecord
      console.log(this.updatedFormulaRecord);

    }
    else {
      this.updatedFormulaRecord = undefined;
      console.log(this.updatedFormulaRecord);
    }
  }
  expandAll() {
    this.mainItemsRecords.forEach(item => this.expandedRows[item.mainItemCode] = true);
  }
  collapseAll() {
    this.expandedRows = {};
  }

  // For Edit  MainItem
  clonedMainItem: { [s: number]: MainItem } = {};
  onMainItemEditInit(record: MainItem) {
    this.clonedMainItem[record.mainItemCode] = { ...record };
  }
  onMainItemEditSave(index: number, record: MainItem) {
    console.log(record);

    const { mainItemCode, total, totalWithProfit, ...mainItemWithoutMainItemCode } = record;
    const updatedMainItem = this.removePropertiesFrom(mainItemWithoutMainItemCode, ['mainItemCode', 'subItemCode']);
    console.log(updatedMainItem);

    console.log(this.updateSelectedServiceNumber);
    if (this.updateSelectedServiceNumberRecord) {
      // (record?.subItems ?? []).map(subItem =>
      //   this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
      // )
      const newRecord: MainItem = {
        ...record, // Copy all properties from the original record
        // Modify specific attributes
        subItems: (record?.subItems ?? []).map(subItem =>
          this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
        ),
        unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
      };
      console.log(newRecord);
      this._ApiService.patch<MainItem>('mainitems', record.mainItemCode, newRecord).subscribe(response => {
        console.log('mainitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        this.totalValue = 0;
        this.ngOnInit()
      });
    }
    if (this.updateSelectedServiceNumberRecord && this.updatedFormulaRecord && this.resultAfterTestUpdate) {
      console.log(record);
      console.log(this.updateSelectedServiceNumberRecord);
      const newRecord: MainItem = {
        ...record,
        subItems: (record?.subItems ?? []).map(subItem =>
          this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
        ),
        unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);
      this._ApiService.patch<MainItem>('mainitems', record.mainItemCode, newRecord).subscribe(response => {
        console.log('mainitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        this.totalValue = 0;
        this.ngOnInit()
        // console.log(this.totalValue)
      });
    }
    if (this.updatedFormulaRecord && this.resultAfterTestUpdate) {
      const newRecord: MainItem = {
        ...record,
        subItems: (record?.subItems ?? []).map(subItem =>
          this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
        ),
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);
      this._ApiService.patch<MainItem>('mainitems', record.mainItemCode, newRecord).subscribe(response => {
        console.log('mainitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        this.totalValue = 0;
        this.ngOnInit()
        // console.log(this.totalValue)
      });
    }
    if (!this.updateSelectedServiceNumberRecord && !this.updatedFormulaRecord && !this.resultAfterTestUpdate) {
      console.log({ ...mainItemWithoutMainItemCode });
      this._ApiService.patch<MainItem>('mainitems', record.mainItemCode, { ...updatedMainItem }).subscribe(response => {
        console.log('mainitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        this.totalValue = 0;
        //this.modelSpecDetailsService.getRecords();
        this.ngOnInit()
      });
    }
  }
  onMainItemEditCancel(row: MainItem, index: number) {
    this.mainItemsRecords[index] = this.clonedMainItem[row.mainItemCode]
    delete this.clonedMainItem[row.mainItemCode]
  }

  // For Edit  SubItem
  clonedSubItem: { [s: number]: SubItem } = {};
  onSubItemEditInit(record: SubItem) {
    if (record.subItemCode) {
      this.clonedSubItem[record.subItemCode] = { ...record };
    }
  }
  onSubItemEditSave(index: number, record: SubItem) {
    console.log(record);
    console.log(index);


    const { subItemCode, ...subItemWithoutSubItemCode } = record;

    console.log(this.updateSelectedServiceNumber);
    if (this.updateSelectedServiceNumberRecord) {
      const newRecord: SubItem = {
        ...record, // Copy all properties from the original record
        // Modify specific attributes
        unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
      };
      console.log(newRecord);
      this._ApiService.patch<SubItem>('subitems', index, newRecord).subscribe(response => {
        console.log('subitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        // this.totalValue = 0;
        this.ngOnInit()
      });
    }
    if (this.updateSelectedServiceNumberRecord && this.updatedFormulaRecord && this.resultAfterTestUpdate) {
      console.log(record);
      console.log(this.updateSelectedServiceNumberRecord);
      const newRecord: SubItem = {
        ...record,
        unitOfMeasurementCode: this.updateSelectedServiceNumberRecord.baseUnitOfMeasurement,
        description: this.updateSelectedServiceNumberRecord.description,
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);
      this._ApiService.patch<SubItem>('subitems', index, newRecord).subscribe(response => {
        console.log('subitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        // this.totalValue = 0;
        this.ngOnInit()
        // console.log(this.totalValue)
      });
    }
    if (this.updatedFormulaRecord && this.resultAfterTestUpdate) {
      const newRecord: SubItem = {
        ...record,
        quantity: this.resultAfterTestUpdate,
      };
      console.log(newRecord);
      this._ApiService.patch<SubItem>('subitems', index, newRecord).subscribe(response => {
        console.log('subitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        // console.log(this.totalValue)
        //this.totalValue = 0;
        this.ngOnInit()
        // console.log(this.totalValue)
      });
    }
    if (!this.updateSelectedServiceNumberRecord && !this.updatedFormulaRecord && !this.resultAfterTestUpdate) {
      this._ApiService.patch<SubItem>('subitems', index, { ...subItemWithoutSubItemCode }).subscribe(response => {
        console.log('subitem updated:', response);
        if (response) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Record is updated' });
        }
        else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid Data' });
        }
        //this.totalValue = 0;
        //this.modelSpecDetailsService.getRecords();
        this.ngOnInit()
      });
    }
  }
  onSubItemEditCancel(row: SubItem, index: number) {
    this.subItemsRecords[index] = this.clonedSubItem[row.subItemCode ? row.subItemCode : 0]
    delete this.clonedSubItem[row.subItemCode ? row.subItemCode : 0]
  }

  // Delete MainItem || SubItem
  deleteRecord() {
    console.log("delete");
    if (this.selectedMainItems.length) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete the selected record?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          for (const record of this.selectedMainItems) {
            console.log(record);
            // const updatedRecord: ModelSpecDetails = {
            //   ...record, // Copy all properties from the original record
            //   deletionIndicator: true
            // }
            this._ApiService.delete<MainItem>('mainitems', record.mainItemCode).subscribe(response => {
              console.log('mainitem deleted :', response);
              this.totalValue = 0;
              this.ngOnInit();
            });
          }
          this.messageService.add({ severity: 'success', summary: 'Successfully', detail: 'Deleted', life: 3000 });
          this.selectedMainItems = []; // Clear the selectedRecords array after deleting all records
        }
      });
    }
    if (this.selectedSubItems.length) {
      this.confirmationService.confirm({
        message: 'Are you sure you want to delete the selected record?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          for (const record of this.selectedSubItems) {
            console.log(record);
            // const updatedRecord: ModelSpecDetails = {
            //   ...record, // Copy all properties from the original record
            //   deletionIndicator: true
            // }
            if (record.subItemCode) {
              this._ApiService.delete<SubItem>('subitems', record.subItemCode).subscribe(response => {
                console.log('subitem deleted :', response);
                //this.totalValue = 0;
                this.ngOnInit();
              });
            }

          }
          this.messageService.add({ severity: 'success', summary: 'Successfully', detail: 'Deleted', life: 3000 });
          this.selectedSubItems = []; // Clear the selectedRecords array after deleting all records
        }
      });
    }
  }

  // For Add new  Main Item
  newMainItem: MainItem = {
    mainItemCode: 0,
    serviceNumberCode: 0,
    description: "",
    quantity: 0,
    unitOfMeasurementCode: "",
    formulaCode: "",
    amountPerUnit: 0,
    currencyCode: "",
    total: 0,
    profitMargin: 0,
    totalWithProfit: 0
  };

  addMainItem() {
    if (!this.selectedServiceNumberRecord && !this.selectedFormulaRecord) { // if user didn't select serviceNumber && didn't select formula

      const newRecord = {
        unitOfMeasurementCode: this.selectedUnitOfMeasure,
        currencyCode: this.selectedCurrency,
        description: this.newMainItem.description,
        quantity: this.newMainItem.quantity,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit
      }
      if (this.newMainItem.quantity === 0 || this.newMainItem.description === "" || this.newMainItem.currencyCode === "") {
        // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
        this._ApiService.post<MainItem>('mainitems', filteredRecord).subscribe((response: MainItem) => {
          console.log('mainitem created:', response);
          if (response) {
            this.resetNewMainItem();
          }
          console.log(response);
          this.totalValue = 0;
          this.ngOnInit()
        });
      }
    }
    else if (!this.selectedServiceNumberRecord && this.selectedFormulaRecord && this.resultAfterTest) { // if user didn't select serviceNumber && select formula
      const newRecord = {
        unitOfMeasurementCode: this.selectedUnitOfMeasure,
        currencyCode: this.selectedCurrency,
        formulaCode: this.selectedFormula,
        description: this.newMainItem.description,
        quantity: this.resultAfterTest,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit
      }
      if (this.resultAfterTest === 0 || this.newMainItem.description === "" || this.newMainItem.currencyCode === "") {
        // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
        this._ApiService.post<MainItem>('mainitems', filteredRecord).subscribe((response: MainItem) => {
          console.log('mainitem created:', response);
          if (response) {
            this.resetNewMainItem();
            this.selectedFormulaRecord = undefined
            console.log(this.newMainItem);
          }
          console.log(response);
          this.totalValue = 0;
          this.ngOnInit()
        });
      }
    }
    else if (this.selectedServiceNumberRecord && !this.selectedFormulaRecord && !this.resultAfterTest) { // if user select serviceNumber && didn't select formula
      const newRecord = {
        serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode: this.selectedServiceNumberRecord.baseUnitOfMeasurement,
        currencyCode: this.selectedCurrency,
        description: this.selectedServiceNumberRecord.description,
        quantity: this.newMainItem.quantity,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit
      }
      if (this.newMainItem.quantity === 0 || this.newMainItem.description === "" || this.selectedServiceNumberRecord.description === "" || this.newMainItem.currencyCode === "") {
        // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
        this._ApiService.post<MainItem>('mainitems', filteredRecord).subscribe((response: MainItem) => {
          console.log('mainitem created:', response);
          if (response) {
            this.resetNewMainItem();
            this.selectedFormulaRecord = undefined
            this.selectedServiceNumberRecord = undefined
          }
          console.log(response);
          this.totalValue = 0;
          this.ngOnInit()
        });
      }
    }
    else if (this.selectedServiceNumberRecord && this.selectedFormulaRecord && this.resultAfterTest) { // if user select serviceNumber && select formula
      const newRecord = {
        serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode: this.selectedServiceNumberRecord.baseUnitOfMeasurement,
        currencyCode: this.selectedCurrency,
        formulaCode: this.selectedFormula,
        description: this.selectedServiceNumberRecord.description,
        quantity: this.resultAfterTest,
        amountPerUnit: this.newMainItem.amountPerUnit,
        total: this.newMainItem.total,
        profitMargin: this.newMainItem.profitMargin,
        totalWithProfit: this.newMainItem.totalWithProfit
      }
      if (this.resultAfterTest === 0 || this.selectedServiceNumberRecord.description === "" || this.newMainItem.currencyCode === "") {
        // || this.newMainItem.unitOfMeasurementCode === ""  // till retrieved from cloud correctly
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Description & Quantity & Currency and UnitOfMeasurement are required',
          life: 3000
        });
      }
      else {
        console.log(newRecord);
        // Remove properties with empty or default values
        const filteredRecord = Object.fromEntries(
          Object.entries(newRecord).filter(([_, value]) => {
            return value !== '' && value !== 0 && value !== undefined && value !== null;
          })
        );
        console.log(filteredRecord);
        this._ApiService.post<MainItem>('mainitems', filteredRecord).subscribe((response: MainItem) => {
          console.log('mainitem created:', response);
          if (response) {
            this.resetNewMainItem();
            this.selectedFormulaRecord = undefined
            this.selectedServiceNumberRecord = undefined
          }
          console.log(response);
          this.totalValue = 0;
          this.ngOnInit()
        });
      }
    }
  }

  resetNewMainItem() {
    this.newMainItem = {
      mainItemCode: 0,
      serviceNumberCode: 0,
      description: "",
      quantity: 0,
      unitOfMeasurementCode: "",
      formulaCode: "",
      amountPerUnit: 0,
      currencyCode: "",
      total: 0,
      profitMargin: 0,
      totalWithProfit: 0,
      // subItems?:SubItem[]
    },
      this.selectedUnitOfMeasure = '';
    this.selectedFormula = '';
    // this.selectedServiceNumber=0
  }

  // For Add new  Sub Item
  newSubItem: SubItem = {
    subItemCode: 0,
    mainItemCode: 0,
    serviceNumberCode: 0,
    description: "",
    quantity: 0,
    unitOfMeasurementCode: "",
    formulaCode: "",
    amountPerUnit: 0,
    currencyCode: "",
    total: 0
  };
  addSubItem(mainItem: MainItem) {
    console.log(mainItem);
    if (!this.selectedServiceNumberRecord && !this.selectedFormulaRecord) { // if user didn't select serviceNumber && didn't select formula
      const newRecord = {
        //serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode: this.selectedUnitOfMeasure,
        currencyCode: this.selectedCurrency,
        //formulaCode: this.selectedFormula,
        description: this.newSubItem.description,
        quantity: this.newSubItem.quantity,
        amountPerUnit: this.newSubItem.amountPerUnit,
        //total: this.newSubItem.total
      }
      console.log(newRecord)
      const filteredSubItem = Object.fromEntries(
        Object.entries(newRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredSubItem);

      // const { mainItemCode, ...mainItemWithoutMainItemCode } = mainItem;
      const { mainItemCode, total, totalWithProfit, ...mainItemWithoutMainItemCode } = mainItem;

      // if(mainItem.subItems){
      // const {mainItemCode,subItemCode,...subItems }= mainItem.subItems
      // }

      const updatedRecord: MainItem = {
        ...mainItemWithoutMainItemCode, // Copy all properties from the original record
        // subItems: [...(mainItem?.subItems ?? []), filteredSubItem],
        subItems: [
          ...(mainItem?.subItems ?? []).map(subItem =>
            this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
          ),
          filteredSubItem
        ],

        mainItemCode: 0,
        totalWithProfit: 0
      }
      console.log(updatedRecord.subItems);



      // if (this.newMainItem.quantity === 0 || this.newMainItem.grossPrice === 0) {
      //   this.messageService.add({
      //     severity: 'error',
      //     summary: 'Error',
      //     detail: 'Quantity and GrossPrice are required',
      //     life: 3000
      //   });
      // }
      console.log(updatedRecord);
      // Remove properties with empty or default values
      const filteredRecord = Object.fromEntries(
        Object.entries(updatedRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredRecord);
      this._ApiService.patch<MainItem>('mainitems', mainItem.mainItemCode, filteredRecord).subscribe((response: MainItem) => {
        console.log('mainitem Updated && subItem Created:', response);
        if (response) {
          this.resetNewMainItem();
          console.log(this.newSubItem);
        }
        console.log(response);
        this.ngOnInit()
      });
    }
    else if (!this.selectedServiceNumberRecord && this.selectedFormulaRecord && this.resultAfterTest) { // if user didn't select serviceNumber && select formula
      const newRecord = {
        //serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode: this.selectedUnitOfMeasure,
        currencyCode: this.selectedCurrency,
        formulaCode: this.selectedFormula,
        description: this.newSubItem.description,
        quantity: this.resultAfterTest,
        amountPerUnit: this.newSubItem.amountPerUnit,
        // total: this.newSubItem.total
      }
      console.log(newRecord);

      const filteredSubItem = Object.fromEntries(
        Object.entries(newRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredSubItem);

      // const { mainItemCode, ...mainItemWithoutMainItemCode } = mainItem;
      const { mainItemCode, total, totalWithProfit, ...mainItemWithoutMainItemCode } = mainItem;
      const updatedRecord: MainItem = {
        ...mainItemWithoutMainItemCode, // Copy all properties from the original record
        //   subItems: [...(mainItem?.subItems ?? []), filteredSubItem],
        //   mainItemCode: 0,
        //   totalWithProfit: 0
        // }
        subItems: [
          ...(mainItem?.subItems ?? []).map(subItem =>
            this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
          ),
          filteredSubItem
        ],

        mainItemCode: 0,
        totalWithProfit: 0
      }
      console.log(updatedRecord.subItems);

      // if (this.resultAfterTest === 0 || this.newMainItem.grossPrice === 0) {
      //   this.messageService.add({
      //     severity: 'error',
      //     summary: 'Error',
      //     detail: 'Quantity and GrossPrice are required',
      //     life: 3000
      //   });
      // }

      // Remove properties with empty or default values
      const filteredRecord = Object.fromEntries(
        Object.entries(updatedRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredRecord);
      this._ApiService.patch<MainItem>('mainitems', mainItem.mainItemCode, filteredRecord).subscribe((response: MainItem) => {
        console.log('mainitem Updated && subItem Created:', response);
        if (response) {
          this.resetNewMainItem();
          console.log(this.newSubItem);
        }
        console.log(response);
        this.ngOnInit()
      });
    }
    else if (this.selectedServiceNumberRecord && !this.selectedFormulaRecord && !this.resultAfterTest) { // if user select serviceNumber && didn't select formula

      const newRecord = {
        serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode: this.selectedServiceNumberRecord.baseUnitOfMeasurement,
        currencyCode: this.selectedCurrency,
        //formulaCode: this.selectedFormula,
        description: this.selectedServiceNumberRecord.description,
        // quantity: this.selectedFormulaRecord.result,
        quantity: this.newSubItem.quantity,
        amountPerUnit: this.newSubItem.amountPerUnit,
        // total: this.newSubItem.total
      }
      console.log(newRecord);

      const filteredSubItem = Object.fromEntries(
        Object.entries(newRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredSubItem);

      // const { mainItemCode, ...mainItemWithoutMainItemCode } = mainItem;
      const { mainItemCode, total, totalWithProfit, ...mainItemWithoutMainItemCode } = mainItem;
      const updatedRecord: MainItem = {
        ...mainItemWithoutMainItemCode, // Copy all properties from the original record
        //   subItems: [...(mainItem?.subItems ?? []), filteredSubItem],
        //   mainItemCode: 0,
        //   totalWithProfit: 0
        // }
        subItems: [
          ...(mainItem?.subItems ?? []).map(subItem =>
            this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
          ),
          filteredSubItem
        ],

        mainItemCode: 0,
        totalWithProfit: 0
      }

      console.log(updatedRecord);
      console.log(updatedRecord.subItems);

      // if ( this.newMainItem.quantity === 0 || this.newMainItem.grossPrice === 0) {
      //   this.messageService.add({
      //     severity: 'error',
      //     summary: 'Error',
      //     detail: 'Quantity and GrossPrice are required',
      //     life: 3000
      //   });
      // }
      // Remove properties with empty or default values
      const filteredRecord = Object.fromEntries(
        Object.entries(updatedRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredRecord);
      this._ApiService.patch<MainItem>('mainitems', mainItem.mainItemCode, filteredRecord).subscribe((response: MainItem) => {
        console.log('mainitem Updated && subItem Created:', response);
        if (response) {
          this.resetNewMainItem();
          this.selectedFormulaRecord = undefined;
          this.selectedServiceNumberRecord = undefined
          console.log(this.newSubItem);

          // const newDetail = response;
          // if (this.modelSpecRecord) {
          //   this.modelSpecRecord.modelSpecDetailsCode.push(newDetail.modelSpecDetailsCode);
          //   this.apiService.put<ModelEntity>('modelspecs', this.modelSpecRecord.modelSpecCode, this.modelSpecRecord).subscribe(updatedModel => {
          //     console.log('Model updated:', updatedModel);
          //   });
          // }
        }
        console.log(response);
        //this.totalValue = 0;
        //this.modelSpecDetailsService.getRecords();
        this.ngOnInit()
      });
    }
    else if (this.selectedServiceNumberRecord && this.selectedFormulaRecord && this.resultAfterTest) { // if user select serviceNumber && select formula
      const newRecord = {
        serviceNumberCode: this.selectedServiceNumber,
        unitOfMeasurementCode: this.selectedServiceNumberRecord.baseUnitOfMeasurement,
        currencyCode: this.selectedCurrency,
        formulaCode: this.selectedFormula,
        description: this.selectedServiceNumberRecord.description,
        quantity: this.resultAfterTest,
        //quantity: this.newSubItem.quantity,
        amountPerUnit: this.newSubItem.amountPerUnit,
        //total: this.newSubItem.total
      }
      console.log(newRecord);
      const filteredSubItem = Object.fromEntries(
        Object.entries(newRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredSubItem);

      //const { mainItemCode, ...mainItemWithoutMainItemCode } = mainItem;
      const { mainItemCode, total, totalWithProfit, ...mainItemWithoutMainItemCode } = mainItem;
      const updatedRecord: MainItem = {
        ...mainItemWithoutMainItemCode, // Copy all properties from the original record
        //   subItems: [...(mainItem?.subItems ?? []), filteredSubItem],
        //   mainItemCode: 0,
        //   totalWithProfit: 0
        // }
        subItems: [
          ...(mainItem?.subItems ?? []).map(subItem =>
            this.removeProperties(subItem, ['mainItemCode', 'subItemCode'])
          ),
          filteredSubItem
        ],

        mainItemCode: 0,
        totalWithProfit: 0
      }
      console.log(updatedRecord.subItems);
      console.log(updatedRecord);
      // if ( this.resultAfterTest === 0 || this.newMainItem.grossPrice === 0) {
      //   this.messageService.add({
      //     severity: 'error',
      //     summary: 'Error',
      //     detail: 'Quantity and GrossPrice are required',
      //     life: 3000
      //   });
      // }
      // Remove properties with empty or default values
      const filteredRecord = Object.fromEntries(
        Object.entries(updatedRecord).filter(([_, value]) => {
          return value !== '' && value !== 0 && value !== undefined && value !== null;
        })
      );
      console.log(filteredRecord);
      this._ApiService.patch<MainItem>('mainitems', mainItem.mainItemCode, filteredRecord).subscribe((response: MainItem) => {
        console.log('mainitem Updated && subItem Created:', response);
        if (response) {
          this.resetNewMainItem();
          this.selectedFormulaRecord = undefined;
          this.selectedServiceNumberRecord = undefined
          console.log(this.newSubItem);
        }
        console.log(response);
        this.ngOnInit()
      });
    }
  }

  resetNewSubItem() {
    this.newSubItem = {
      subItemCode: 0,
      mainItemCode: 0,
      serviceNumberCode: 0,
      description: "",
      quantity: 0,
      unitOfMeasurementCode: "",
      formulaCode: "",
      amountPerUnit: 0,
      currencyCode: "",
      total: 0
    },
      this.selectedUnitOfMeasure = '';
    this.selectedFormula = '';
  }

  // Export  to Excel Sheet
  exportExcel() {

    import('xlsx').then((xlsx) => {
      const selectedRows = this.mainItemsRecords;
      const worksheet = xlsx.utils.json_to_sheet(selectedRows);
      const workbook = { Sheets: { data: worksheet }, SheetNames: ['data'] };
      const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
      this.saveAsExcelFile(excelBuffer, 'invoice');
    });
  }
  saveAsExcelFile(buffer: any, fileName: string): void {
    let EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    let EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], {
      type: EXCEL_TYPE
    });
    FileSaver.saveAs(data, fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION);
  }
  // handle Formula Parameters 
  showPopup: boolean = false;
  parameterValues: { [key: string]: number } = {};
  showPopupUpdate: boolean = false;
  parameterValuesUpdate: { [key: string]: number } = {};
  openPopup() {
    if (this.selectedFormulaRecord) {
      this.showPopup = true;
      for (const parameterId of this.selectedFormulaRecord.parameterIds) {
        this.parameterValues[parameterId] = 0;
        console.log(this.parameterValues);
      }
    }
    else {
      this.showPopup = false;
    }
  }
  openPopupUpdate() {
    if (this.updatedFormulaRecord) {
      this.showPopupUpdate = true;
      console.log(this.showPopupUpdate);

      for (const parameterId of this.updatedFormulaRecord.parameterIds) {
        this.parameterValuesUpdate[parameterId] = 0;
        console.log(this.parameterValuesUpdate);
      }
    }
    else {
      this.showPopupUpdate = false;
    }
  }
  resultAfterTest!: number
  resultAfterTestUpdate!: number
  saveParameters() {
    if (this.selectedFormulaRecord) {
      console.log(this.parameterValues);
      const valuesOnly = Object.values(this.parameterValues)
        .filter(value => typeof value === 'number') as number[];
      console.log(valuesOnly);
      console.log(this.resultAfterTest);

      const formulaObject: any = {
        formula: this.selectedFormulaRecord.formula,
        description: this.selectedFormulaRecord.description,
        numberOfParameters: this.selectedFormulaRecord.numberOfParameters,
        parameterIds: this.selectedFormulaRecord.parameterIds,
        parameterDescriptions: this.selectedFormulaRecord.parameterDescriptions,
        formulaLogic: this.selectedFormulaRecord.formulaLogic,
        testParameters: valuesOnly
      };
      console.log(formulaObject);
      this._ApiService.patch<any>('formulas', this.selectedFormulaRecord.formulaCode, formulaObject).subscribe((response: Formula) => {
        console.log('formula updated:', response);
        this.resultAfterTest = response.result;
        console.log(this.resultAfterTest);
      });
      this.showPopup = false;
    }
    if (this.updatedFormulaRecord) {
      console.log(this.parameterValuesUpdate);
      const valuesOnly = Object.values(this.parameterValuesUpdate)
        .filter(value => typeof value === 'number') as number[];
      console.log(valuesOnly);
      console.log(this.resultAfterTestUpdate);
      const formulaObject: any = {
        formula: this.updatedFormulaRecord.formula,
        description: this.updatedFormulaRecord.description,
        numberOfParameters: this.updatedFormulaRecord.numberOfParameters,
        parameterIds: this.updatedFormulaRecord.parameterIds,
        parameterDescriptions: this.updatedFormulaRecord.parameterDescriptions,
        formulaLogic: this.updatedFormulaRecord.formulaLogic,
        testParameters: valuesOnly
      };
      console.log(formulaObject);
      this._ApiService.put<any>('formulas', this.updatedFormulaRecord.formulaCode, formulaObject).subscribe((response: Formula) => {
        console.log('formula updated:', response);
        this.resultAfterTestUpdate = response.result;
        console.log(this.resultAfterTestUpdate);

      });
      this.showPopupUpdate = false;
    }

  }
}


