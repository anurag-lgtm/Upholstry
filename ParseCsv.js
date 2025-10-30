const axios = require("axios");
const { Readable } = require("stream");
const fs = require("fs");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const {
  createItem,
  createSubitemMutation,
  createGroup,
  generateBoard,
  changeLinkColumn,
  getColumnValue,
} = require("./Services/mondayService");
function makeBoardViewData(data) {
  const result = data.reduce((acc, item) => {
    if (item.Subitems_Status_Column_Joinery) {
      if (!acc[item.Subitems_Status_Column_Joinery?.trim()]) {
        acc[item?.Subitems_Status_Column_Joinery?.trim()] = new Set(); // use Set to keep unique joineryTypes
      }
      acc[item?.Subitems_Status_Column_Joinery?.trim()].add(
        item.Subitems_Checklist
      );
    }
    return acc;
  }, {});

  // Convert Sets to arrays and count unique Subitems_Status_Column_Joinery types
  const finalResult = Object.entries(result).map(
    ([Subitems_Status_Column_Joinery, typesSet]) => ({
      Subitems_Status_Column_Joinery,
      uniqueJoineryTypes: Array.from(typesSet),
      count: typesSet.size,
    })
  );

  console.log(finalResult);
  return finalResult;
}

function groupItems(data) {
  let result = [];
  let currentItem = null;
  let currentGroup = null;

  // Loop through each record
  data.forEach((record) => {
    const group = record.Group;
    const item = record.Item;
    const subitemName = record["Subitem Name"];
    const subitemStatus = record["Subitem Column(Status)"];

    // If the Group or the last part of the Item (after dot) changes, create a new item
    const itemSuffix = item.split(".").pop();

    if (currentGroup !== group || currentItem !== itemSuffix) {
      // If group or item changes, push the new item and reset subitems
      currentGroup = group;
      currentItem = itemSuffix;
      result.push({
        Group: group,
        Item: item,
        Subitems: [],
      });
    }

    // Add the current subitem to the last item in the result
    const currentSubitem = {
      Name: subitemName,
      Status: subitemStatus,
    };
    result[result.length - 1].Subitems.push(currentSubitem);
  });

  return result;
}
const groupIds = {
  "Building A": "group_mkwsrt7g",
  "Building B": "group_mkwsxent",
  "Building C": "group_mkwsrnpv",
  "Building D": "group_mkwsqe0q",
};

async function processData(data, boardId, sheetName,jobCode ) {
  let currentItemId = null;
  let currentGroup = null;
  const groupIdMap = {}; // { 'B3': 'group_id_1', 'B4': 'group_id_2' }
  const itemIdMap = {};
  const uniqueBuild = {};


  const a = makeBoardViewData(data);
  // const groupId = await createGroup(sheetName, boardId);
  console.log(a.length, a, sheetName, "sheetName", jobCode);
 const ItemCol=JSON.stringify(`{"text_mkwt3bbg": "${jobCode || ""}"}`)
  const subItemCol=JSON.stringify(`{"text_mkwtxm06": "${jobCode || ""}"}`)
  for (var j = 0; j < a.length; j++) {
    const it = await createItem(
      boardId,
      groupIds[sheetName] || "topics",
      {},
      a[j].Subitems_Status_Column_Joinery
    );
    console.log("ITEMCREATION", a[j].Subitems_Status_Column_Joinery);
    for (var k = 0; k < a[j].uniqueJoineryTypes.length; k++) {
      console.log("subitemitem", a[j].uniqueJoineryTypes[k]);
      const bd = await createSubitemMutation(
        `"${it.create_item.id}"`,
        `"${a[j].uniqueJoineryTypes[k]}"`,
      subItemCol
      );
      console.log(bd, "SUBITEMCREATION" ,subItemCol);
    }
  }

 
  // Loop through each record in the data
  for (const record of data) {
    const {
      Group,
      Item,
      "Subitem Name": subitemName,
      "Subitem Column(Status)": subitemStatus,
      SI_No_Col_Width,
      SI_No_Col_Depth,
      SI_No_Col_Value,
      Subitems_Checklist,
      Subitems_Status_Column2,
      Subitems_Status_Column_Joinery,
    } = record;
    // console.log(record, "record");

    if (!groupIdMap[Group]) {
      console.log(`Creating group "${Group}"...`);
      const groupId = await createGroup(Group, boardId);
      groupIdMap[Group] = groupId;
    }
    if (!itemIdMap[Item]) {
      console.log(`Creating item "${Item}" in group "${Group}"...`);

      const itemId = await createItem(boardId, groupIdMap[Group], ItemCol, Item);
      itemIdMap[Item] = itemId.create_item.id;
    }

    const s = JSON.stringify(
      `{"status": "${Subitems_Status_Column_Joinery || ""}","text_mkwtxm06": "${jobCode || ""}"}`
    );
    await createSubitemMutation(
      `"${itemIdMap[Item]}"`,
      `"${Subitems_Checklist}"`,
      s
    );

    // a.forEach(async(b)=>{

    // }

    // console.log(a, "ASDASASDASDSD");
  }

}
async function parseCsvFromUrl(url, name, currBoardId, itemId) {
  console.log("CSV file successfully processed.");
  const boardId = await generateBoard(name);

  const updatelink = await changeLinkColumn(
    boardId,
    itemId,
    "link_mkw8v8hm",
    name,
    currBoardId
  );
  console.log(updatelink, "asd");
  const jobCode=await getColumnValue(itemId,"text_mkvwe4h5")

  // Call the function to process and create items and subitems
  console.log(boardId, "bouadadad",jobCode);
  const items = await parseExcelFromUrl(url, boardId, jobCode);
  console.log(items, "items");

  return "ok";
}

async function parseExcelFromUrl(url, boardId,jobCode) {
  const res = await fetch(url); // global fetch in Node 18+ or node-fetch v3
  const arrayBuffer = await res.arrayBuffer(); // get ArrayBuffer
  const buffer = Buffer.from(arrayBuffer); // convert to Node.js Buffer

  const workbook = await XLSX.read(buffer, { type: "buffer" });

  // TAKEOFF---------------------------->

  // TAKEOFF---------------------------->

  for (let i = 0; i < workbook.SheetNames.length; i++) {
    console.log(workbook.SheetNames[i], "SHEET NAME");
    const sheet = workbook.Sheets[workbook.SheetNames[i]];
    const items = XLSX.utils.sheet_to_json(sheet);
    // console.log(items, "ITEMS SHEET");
    await processData(items.slice(2), boardId, workbook.SheetNames[i],jobCode).catch(
      (err) => {
        console.error("Error processing data:", err);
      }
    );
  }

  // console.log(XLSX.utils.sheet_to_json(sheet),"XLSX.utils.sheet_to_json(sheet)XLSX.utils.sheet_to_json(sheet)")
  return "ok";
}

module.exports = { parseCsvFromUrl };
