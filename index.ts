import { RecurrenceRule, scheduleJob } from "node-schedule";
import {
  checkForChanges,
  initialize,
  loadData,
  printData,
  saveData,
} from "./utils";

import moment from "moment";

const FORMAT = "MMMM Do, HH:mm:ss";

const runChecks = async () => {
  console.log(moment().format(FORMAT), "Starting checks...");
  var data = await initialize();
  if (!data) return;
  data = await loadData(data);
  data = await checkForChanges(data);

  printData(data);
  saveData(data);
};

const rule = new RecurrenceRule();
rule.hour = [9, 12, 15, 18, 21];
rule.minute = 0;

console.log(moment().format(FORMAT), "Started program");

runChecks();

scheduleJob(rule, runChecks);
