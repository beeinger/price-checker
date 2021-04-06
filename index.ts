import {
  checkForChanges,
  initialize,
  loadData,
  printData,
  saveData,
} from "./utils";

(async () => {
  var data = await initialize();
  if (!data) return;
  data = await loadData(data);
  data = await checkForChanges(data);

  printData(data);
  saveData(data);
})();
