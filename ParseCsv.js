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
} = require("./Services/mondayService");
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

async function processData(data, boardId) {
  let currentItemId = null;
  let currentGroup = null;
  const groupIdMap = {}; // { 'B3': 'group_id_1', 'B4': 'group_id_2' }
  const itemIdMap = {};
  const uniqueBuild = {};
  // const a = makeBoardViewData(data);
  // a.forEach(async(b)=>{
  // for (var j = 0; j < a.length; j++) {
  //   const it = await createItem(
  //     boardId,
  //     "topics",
  //     {},
  //     a[j].Subitems_Status_Column2
  //   );
  //   for (var i = 0; i < a[j].uniqueJoineryTypes.length; i++) {
  //     const bd = await createSubitemMutation(
  //       it.create_item.id,
  //       a[j].uniqueJoineryTypes[i],
  //       {}
  //     );
  //   }

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
        Subitems_Status_Column_Joinery
      } = record;
      console.log(record, "record");
    //   // const itemSuffix = Item.split(".").pop(); // Extract the number after the last dot to check for uniqueness
    //   // console.log(
    //   //   currentGroup,
    //   //   currentItemId,
    //   //   itemSuffix,
    //   //   Group,
    //   //   Item,
    //   //   currentGroup !== Group ||
    //   //     currentItemId === null ||
    //   //     !Item.endsWith(itemSuffix)
    //   // );
    //   // if (currentGroup !== Group || currentItemId === null || !Item.endsWith(itemSuffix)) {
    //   //   // Create new item if Group or Item changes
    //   //   console.log(`Creating item ${Item} in group ${Group}...`);

    //   //   const response = await createItem(5000088478,Group,"",Item);
    //   //   console.log(response,"sad");

        // currentItemId = response.create_item.id;  // Get the ID of the newly created item
        // currentGroup = Group;  // Update the current group
      // }
      if (!groupIdMap[Group]) {
        console.log(`Creating group "${Group}"...`);
        const groupId = await createGroup(Group, boardId);
        groupIdMap[Group] = groupId;
      }
      if (!itemIdMap[Item]) {
        console.log(`Creating item "${Item}" in group "${Group}"...`);

        const itemId = await createItem(boardId, groupIdMap[Group], {}, Item);
        itemIdMap[Item] = itemId.create_item.id;
      }

      // if(!uniqueBuild[`${JOINERY}_${record['JOINERY TYPE']}`]){
      //   uniqueBuild[`${JOINERY}_${record['JOINERY TYPE']}`] =

      // }
        // uniqueBuild[`${Subitems_Checklist}`] = (  uniqueBuild[`${Subitems_Status_Column2}_${Subitems_Checklist}`]|| 0) + 1;

    //     console.log(`${Subitems_Status_Column2}_${Subitems_Checklist}`,Subitems_Status_Column2,Subitems_Checklist)
    //   // // Step 3: Create subitem under the item
    //   // console.log(
    //   //   `Creating subitem "${subitemStatus}" with status "${subitemStatus}" under item "${Item}"...`
    //   // );
      const s = JSON.stringify(`{"numeric_mkw8251h": "${SI_No_Col_Width || ""}","numeric_mkw8g4na": "${SI_No_Col_Depth || ""}","status": "${Subitems_Status_Column_Joinery || ""}","numeric_mkw8k2py": "${SI_No_Col_Value || ""}"}`);
      await createSubitemMutation(itemIdMap[Item], `"${Subitems_Checklist}"`,s);
    // }

    // console.log(a, "ASDASASDASDSD");
  }
}
async function parseCsvFromUrl(url, name, currBoardId, itemId) {
  // const res = await axios.get(url);
  // const csvData = res.data;
  //   console.log(res,"res")

  // return new Promise((resolve, reject) => {
  //   const results = [];
  //   const items = [];
  //   const failedRows = [];
  //   // const fp="./failed_items.csv"
  //   // console.log(fp,"FP")
  //  res.data.pipe(csv()).on("data", (row) => {
  //       items.push(row); // Each row of the CSV file as a JavaScript object
  //     }).on("end", async() => {

  console.log("CSV file successfully processed.");
  const boardId = await generateBoard(name);

 const updatelink = await changeLinkColumn(
    currBoardId,
    itemId,
    "link_mkw8v8hm",
    name
  );
  console.log(updatelink, "asd");

  // Call the function to process and create items and subitems
  console.log(boardId, "bouadadad");
  const items = await parseExcelFromUrl(url, boardId);
  console.log(items, "items");


  return "ok";
  // const groupedData = groupItems(items);
  // console.log(JSON.stringify(groupedData, null, 2));

  // console.log(groupedData,'data')

  // for(var i=1;i<20;i++){
  //     console.log(items[i],"asd")
  //     const Group=items[i].Group
  //     const ItemGroup=items[i].Item.split(".")[0]
  //     const ItemSeq=items[i].Item.split(".")[0]
  //     SubName=items[i]['Subitem Name']
  //     ColValue=items[i]['Subitem Column(Status)']

  // }
  // });
  // Readable.from(fp)
  //   .pipe(csv())
  //   .on("data", (row) => {
  //     const filtered = {};
  //     console.log(row,"ROWWW")
  //      items.push(row)
  //     // for (const col of selectedColumns) {
  //     //   filtered[col] = row[col];
  //     // }
  //     // results.push(filtered);
  //   })
  //  .on("end", async () => {
  //          console.log(items,"item");

  //          for (const row of items) {
  //            // Assume your CSV has columns: name, status, due_date
  //            const itemName = "SD";

  //            // Build column values mapping CSV → Monday columns
  //           //  const columnValues = {
  //           //    "text_mkw1298a": { label: row.PONUMBER },
  //           //    // "date_mkvyphmt": { date: row.PODATE },
  //           //    // "date_mkvyj1dn": { date: row.REQUIREDDELIVERYDATE },
  //           //    // "date_mkvyv79j": { date: row.DONTDELIVERBEFOREDATE },
  //           //    // "date_mkvywwss": { date: row.DONTDELIVERAFTERDATE },
  //           //    // "text_mkvy1j61": row.STORENAME || "" ,
  //           //    // "text_mkvyb911": row.PROMO|| "",
  //           //    // "text_mkvyttat": row.SHIPTO || "",
  //           //    // "line_items__1": row.LINE || ""
  //           //  };
  //                  const columnValues = `{"text_mkw1298a":"${row.PONUMBER}"} `

  //            const result = await createItem(5000088478, "topics", JSON.stringify(columnValues),itemName);
  //           //  const result = await createItem(5000088478, "topics", itemName, JSON.stringify(columnValues));

  //            if (result && result?.create_item?.id) {
  //              console.log("Created item:", result.create_item.id);
  //            } else {
  //              console.log("Failed for row:", row);
  //              failedRows.push(row);
  //            }

  //            // throttle between requests
  //            await new Promise((resolve) => setTimeout(resolve, 300));
  //          }

  //          // Write failed rows to failed_items.csv
  //          if (failedRows.length > 0) {
  //            const header = Object.keys(failedRows[0]).join(",") + "\n";
  //            const rows = failedRows.map((r) => Object.values(r).join(",")).join("\n");
  //            fs.writeFileSync("failed_items.csv", header + rows);
  //            console.log(`Saved ${failedRows.length} failed rows to failed_items.csv`);
  //          } else {
  //            console.log("All rows processed successfully ✅");
  //          }

  //          resolve();
  //        })
  //   .on("error", reject);
  // });
}

async function parseExcelFromUrl(url, boardId, itemId) {
  const res = await fetch(url); // global fetch in Node 18+ or node-fetch v3
  const arrayBuffer = await res.arrayBuffer(); // get ArrayBuffer
  const buffer = Buffer.from(arrayBuffer); // convert to Node.js Buffer

  const workbook =await XLSX.read(buffer, { type: "buffer" });
 
  for(let i=0;i<workbook.SheetNames.length;i++){
    console.log(workbook.SheetNames[i],"SHEET NAME")
    const sheet = workbook.Sheets[workbook.SheetNames[i]];
    const items = XLSX.utils.sheet_to_json(sheet);
    console.log(items,"ITEMS SHEET")
  await processData(items, boardId).catch((err) => {
    console.error("Error processing data:", err);
  });
  }
  
  // console.log(XLSX.utils.sheet_to_json(sheet),"XLSX.utils.sheet_to_json(sheet)XLSX.utils.sheet_to_json(sheet)")
  return "ok";
}

module.exports = { parseCsvFromUrl };
