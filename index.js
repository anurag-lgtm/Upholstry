require("dotenv").config();
const axios = require("axios");
const express = require("express");
const {
  getFileUrl,
  getConnectedBoardName,
  getSpecificItemUsingColumnValue,
  getSubItems,
  createItem,
  createSubitemMutationProcurement,
  createSubitemMutation,
  deleteSubitem,
  getColumnValue,
  LinkConnectedColumnThroughId,
} = require("./Services/mondayService");
const { parseCsvFromUrl } = require("./ParseCsv");
const { SubItemController } = require("./Controller/subItemController");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  console.log("TestHomeEndpoint");
  res.send("ok");
});
app.post("/subItemCreation", async (req, res) => {
  const { itemId, boardId, columnId } = req.body.payload.inputFields;
  console.log(itemId, boardId, "itemId,boardId");
  // res.send("ok")
  try {
   await SubItemController(req, res);
  } catch (err) {
    console.log(err, "err");
  }
});
app.post("/GRN", async(req, res) => {
try{
    const {itemId,boardId}=req.body.payload.inputFields
    const SitemId=await getColumnValue(itemId,"text_mkwp8vq6")
    const SName=await getColumnValue(itemId,"text_mkwpdykv")
    const SSitemId=await getColumnValue(itemId,"text_mkwpkf5r")
    const SBoardId=await getColumnValue(itemId,"text_mkwpmp6x")
    const createItem2=await createItem(18101653253,"topics",{},SName)
  const d=await LinkConnectedColumnThroughId(18101653253,"board_relation_mkwpxmsm",createItem2.create_item.id,SitemId)
  res.send("ok");
}
catch(err){
  //console.log(err,"err");
  res.send("ok");
}
});
app.post("/Upload", async (req, res) => {
  const { itemId, boardId } = req.body.payload.inputFields;
  // res.send("ok")
  try {
    const { url, name } = await getFileUrl(itemId, "file_mkvwbjzy");
    console.log(url, "urlllll");
    parseCsvFromUrl(url, name, boardId, itemId);
    res.send("ok");
  } catch (err) {
    console.log(err, "err");
  }
});
app.post("/checkUpdate", async (req, res) => {
  const { itemId, boardId } = req.body.payload.inputFields;
  console.log(req.body.payload);
  try {
    // res.send("ok")
     const fields=   {
      "sourceSubitemId": "text_mkwpkf5r",
      "sourceParentId": "text_mkwp8vq6",
      "sourceSubitemName": "text_mkwpdykv",
      "sourceParentName": "text_mkwp4ztr",
      "sourceBoardId": "text_mkwpmp6x",
    }
  
    console.log("ASDAS");
    const subitemBoardId = "18073631635";
    const { Supplier, subitemName, parentName,parentId } = await getConnectedBoardName(
      itemId,
      "board_relation_mkw4cgcj"
    );
    const ssId=await getColumnValue(itemId, "text_mkwpp8vf")
    const ssName= await getColumnValue(itemId, "text_mkwp3gpc")
    const sbId=   await getColumnValue(itemId, "text_mkwpy55x")
    const spId=   await getColumnValue(itemId, "text_mkwpt6dn")
    const spName= await getColumnValue(itemId, "text_mkwpkbra")
    console.log(Supplier, "Supplier");
    if (!!Supplier) {
      const today = new Date();
      console.log(today.toISOString().split("T")[0]);
      const SuppliedItemId = await getSpecificItemUsingColumnValue(
        18040007011,
        "name",
        `${Supplier}_${today.toISOString().split("T")[0]}`
      );
      if (!!SuppliedItemId?.id) {
        // IF supplier found in the PO tracker
        const SupplierStatus = await getColumnValue(
          SuppliedItemId.id,
          "color_mkw4hr74"
        );
        if (SupplierStatus != "Confirmed") {
          // IF supplier status is confiremd in the PO tracker then create subitem
          const totalQty = await getColumnValue(itemId, "numeric_mkw44src");
          const level = await getColumnValue(itemId, "dropdown_mkwegdzv");
          const joineryType = await getColumnValue(itemId, "dropdown_mkwer2p0");
          const width = await getColumnValue(itemId, "numeric_mkw4ba42");
          const depth = await getColumnValue(itemId, "numeric_mkw4nz6s");
          const value = await getColumnValue(itemId, "numeric_mkw4506q");
          const joinery = await getColumnValue(itemId, "color_mkw46efg");
          const due_date = await getColumnValue(itemId, "date_mkwafjyr");
          console.log(joineryType, level, "--------------------");
          const formatValueForDropdown = (input) => {
            const arr = input
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
            return arr;
          };
          const s = JSON.stringify(
            `
            {"text_mkwar0b7": "${itemId}-${parentName}",
            "${fields['sourceParentId']}": "${spId}",
            "${fields['sourceBoardId']}": "${sbId}",
            "${fields['sourceSubitemId']}": "${ssId}",
            "${fields['sourceSubitemName']}": "${ssName}",
            "${fields['sourceParentName']}": "${spName}",
            
            "dropdown_mkwg3158":${JSON.stringify(
              { labels: formatValueForDropdown(level) }
            )}, "status":"${
              joinery || ""
            }", "dropdown_mkwgj3zx":${JSON.stringify({
              labels: formatValueForDropdown(joineryType),
            })},"numeric_mkwgmd5z":"${width || 0}", "date0":"${
              due_date || ""
            }", "numeric_mkwgs60v":"${depth || 0}", "numeric_mkwgwg79":"${
              value || 0
            }", "text_mkwcswqw":"${totalQty || ""}"}`
          );
          console.log(s, "s");

          const createdSubitem = await createSubitemMutation(
            SuppliedItemId.id,
            `${parentName}-${subitemName}`,
            s
          );
          console.log(createdSubitem, "createdSubitem");
        } else {
          console.log("NOT CONIFRMED");
          // if supplier status is anything other than not confirmed than create a new one item

          const totalQty = await getColumnValue(itemId, "numeric_mkw44src");
          const level = await getColumnValue(itemId, "dropdown_mkwegdzv");
          const joineryType = await getColumnValue(itemId, "dropdown_mkwer2p0");
          const width = await getColumnValue(itemId, "numeric_mkw4ba42");
          const depth = await getColumnValue(itemId, "numeric_mkw4nz6s");
          const value = await getColumnValue(itemId, "numeric_mkw4506q");
          const joinery = await getColumnValue(itemId, "color_mkw46efg");
          const due_date = await getColumnValue(itemId, "date_mkwafjyr");
          console.log(joineryType, level, "--------------------");
          const today = new Date();
          console.log(today.toISOString().split("T")[0]);
          const itemCreated = await createItem(
            18040007011,
            "topics",
            {},
            `${Supplier}_${today.toISOString().split("T")[0]}`
          );
          console.log(itemCreated, "item crea");
          const s = JSON.stringify(
            `{"text_mkwar0b7": "${itemId}-${parentName}",  
            "${fields['sourceParentId']}": "${spId}",
            "${fields['sourceBoardId']}": "${sbId}",
            "${fields['sourceSubitemId']}": "${ssId}",
            "${fields['sourceSubitemName']}": "${ssName}",
            "${fields['sourceParentName']}": "${spName}",
            "dropdown_mkwg3158":${JSON.stringify(
              { labels: formatValueForDropdown(level) }
            )}, "status":"${
              joinery || ""
            }", "dropdown_mkwgj3zx":${JSON.stringify({
              labels: formatValueForDropdown(joineryType),
            })},"numeric_mkwgmd5z":"${width || 0}", "date0":"${
              due_date || ""
            }", "numeric_mkwgs60v":"${depth || 0}", "numeric_mkwgwg79":"${
              value || 0
            }", "text_mkwcswqw":"${totalQty || ""}"}`
          );
          console.log(s, "sadasd");
          const createdSubitem = await createSubitemMutation(
            itemCreated?.create_item?.id,
            `${parentName}-${subitemName}`,
            s
          );
        }
      } else {
        const TotalQty = await getColumnValue(itemId, "numeric_mkw44src");
        const today = new Date();
        console.log(today.toISOString().split("T")[0]);
        const itemCreated = await createItem(
          18040007011,
          "topics",
          {},
          `${Supplier}_${today.toISOString().split("T")[0]}`
        );
        console.log(itemCreated, "item crea");
        const totalQty = await getColumnValue(itemId, "numeric_mkw44src");
        const level = await getColumnValue(itemId, "dropdown_mkwegdzv");
        const joineryType = await getColumnValue(itemId, "dropdown_mkwer2p0");
        const width = await getColumnValue(itemId, "numeric_mkw4ba42");
        const depth = await getColumnValue(itemId, "numeric_mkw4nz6s");
        const value = await getColumnValue(itemId, "numeric_mkw4506q");
        const joinery = await getColumnValue(itemId, "color_mkw46efg");
        const due_date = await getColumnValue(itemId, "date_mkwafjyr");
        console.log(joineryType, level, "--------------------");
        const formatValueForDropdown = (input) => {
          const arr = input
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
          return arr;
        };
        const s = JSON.stringify(
          `{"text_mkwar0b7": "${itemId}-${parentName}", 
            "${fields['sourceParentId']}": "${spId}",
            "${fields['sourceBoardId']}": "${sbId}",
            "${fields['sourceSubitemId']}": "${ssId}",
            "${fields['sourceSubitemName']}": "${ssName}",
            "${fields['sourceParentName']}": "${spName}"
            ,"dropdown_mkwg3158":${JSON.stringify(
            { labels: formatValueForDropdown(level) }
          )}, "status":"${joinery || ""}", "dropdown_mkwgj3zx":${JSON.stringify(
            { labels: formatValueForDropdown(joineryType) }
          )},"numeric_mkwgmd5z":"${width || 0}", "date0":"${
            due_date || ""
          }", "numeric_mkwgs60v":"${depth || 0}", "numeric_mkwgwg79":"${
            value || 0
          }", "text_mkwcswqw":"${totalQty || ""}"}`
        );
        console.log(s, "s");

        const createdSubitem = await createSubitemMutation(
          itemCreated.create_item.id,
          `${parentName}-${subitemName}`,
          s
        );
      }
    } else {
      const deletedSubitem = await deleteSubitem(
        subitemBoardId,
        `${itemId}-${parentName}`
      );
      console.log(deletedSubitem, "deletedSubitemdeletedSubitem");
    }
  
    res.send("ok");
  } catch (err) {
    res.send("ok");
    console.log(err, "err");
  }
});
app.listen(8080, () => {
  console.log("serverr runnng");
});
