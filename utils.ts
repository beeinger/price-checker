import { Config, Data, TableRow } from "./types";

import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import notifier from "node-notifier";
import open from "open";
// @ts-ignore
import parsePrice from "parse-price";
import path from "path";
import prettier from "prettier";

const DATA = "./data.json";
const CONFIG = "./config.json";

const strip = [" ", "", "\n"];

/**
 * Initialization based on the config file
 *
 * @returns initial data object
 */
export const initialize = async () => {
  var config: Config[] | undefined = undefined;
  try {
    config = await require(CONFIG);
  } catch (e) {
    console.log(
      "\nConfig file not found, please create one.\nIt should be named: ",
      CONFIG,
      `\nAnd the format should be:
      [{
        name: string;
        url: string;
        selector: string;
      }, ...]\n`
    );
  }

  var data: Partial<Data> = {};
  if (!config) return;
  for (const entry of config) {
    data[entry.name] = {
      url: entry.url,
      selector: entry.selector,
      price: {
        numeric: 0,
        beautiful: "0",
      },
      lastPrice: {
        numeric: 0,
        beautiful: "0",
      },
      lowestPrice: {
        numeric: 999999999,
        beautiful: "0",
      },
      highestPrice: {
        numeric: -999999999,
        beautiful: "0",
      },
    };
  }
  return data as Data;
};

/**
 * Loads data from saved file
 *
 * @param {Data} data data object
 * @returns data object with loaded data
 */
export const loadData = async (data: Data) => {
  var _data: Data | undefined = undefined;
  try {
    _data = await require(DATA);
  } catch (e) {
    console.log("\nPrevious data not found\n");
  }
  if (!_data) return data;
  return { ...data, ..._data };
};

/**
 * Check for changes in price for every watched item
 *
 * @param {Data} _data data object
 * @returns updated data object
 */
export const checkForChanges = async (_data: Data) => {
  var data = _data;
  for await (const entry of Object.keys(data)) {
    const [numeric, beautiful] = await getPrice(
      data[entry].url,
      data[entry].selector
    );

    data[entry].lastPrice = data[entry].price;
    data[entry].price = { numeric, beautiful };

    if (data[entry].lowestPrice.numeric > numeric)
      data[entry].lowestPrice = data[entry].price;
    if (data[entry].highestPrice.numeric < numeric)
      data[entry].highestPrice = data[entry].price;
  }
  return data;
};

/**
 * Prints data as a table
 *
 * @param {Data} data data object
 */
export const printData = (data: Data) => {
  const table = Object.keys(data).map((val) => {
    const row: TableRow = {
      name: val,
      price: data[val].price.beautiful,
      change: data[val].lastPrice.numeric - data[val].price.numeric,
      lowest: data[val].lowestPrice.beautiful,
      highest: data[val].highestPrice.beautiful,
    };

    if (row.change == 0) row.change = "-";
    else if (row.change > 0) row.change = "+ " + row.change;

    return row;
  });

  if (!table.length) console.log("No data");
  else console.table(table);

  notify(data, table);
};

/**
 * If the price has changed show a push notification
 *
 * @param data data object
 * @param table table object
 */
const notify = (data: Data, table: TableRow[]) => {
  for (let row of table)
    if (row.change !== "-") {
      notifier.notify(
        {
          title: "Price change spotted!",
          message: row.change + " change in " + row.name + "'s price.",
          wait: true,
          timeout: 60 * 60 * 2,
        },
        () => {
          open(data[row.name].url);
        }
      );
    }
};

/**
 * Saves data to a file
 *
 * @param {Data} _data data object
 */
export const saveData = (_data: Data) => {
  const data = prettier.format(JSON.stringify(_data), {
    semi: false,
    parser: "json",
  });
  if (data === "{}\n") return;

  fs.writeFile(DATA, data, (err) => {
    if (err) {
      console.warn("Error while saving data", err);
    } else {
      console.log("Successfully saved data");
    }
  });
};

/**
 * Filters array of chars
 * <br/>
 * Used to strip a string from white spaces
 *
 * @param {string} value one character sting
 */
const filter = (value: string) => !strip.includes(value);

/**
 * Gets price from a given url using a selector
 *
 * @param {string} url url address of the item
 * @param {string} selector selector to find the price on the page
 * @returns [numerical, beautiful] - returns the numerical value and a human-friendly price string
 */
const getPrice = async (url: string, selector: string) => {
  const html = await axios.get(url),
    $ = await cheerio.load(html.data),
    price = $("body").find(selector).text();
  return [parsePrice(price), price.split("").filter(filter).join("")];
};
