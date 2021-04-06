interface Price {
  numeric: number;
  beautiful: string;
}

export interface Data {
  [name: string]: {
    url: string;
    selector: string;
    price: Price;
    lastPrice: Price;
    lowestPrice: Price;
    highestPrice: Price;
  };
}

export interface Config {
  name: string;
  url: string;
  selector: string;
}

export interface TableRow {
  name: string;
  price: string;
  change: number | string;
  lowest: string;
  highest: string;
}
