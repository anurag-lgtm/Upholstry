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
    SubItemController(itemId, "board_relation_mkw8n6at");
    res.send("ok");
  } catch (err) {
    console.log(err, "err");
  }
});
app.post("/Upload", async (req, res) => {
  const { itemId, boardId } = req.body.payload.inputFields;
  // res.send("ok")
  try {
    const { url, name } = await getFileUrl(itemId, "file_mkw3gzhc");
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
    console.log("ASDAS");
    const subitemBoardId = "18073631635";
    const { Supplier, subitemName, parentName } = await getConnectedBoardName(
      itemId,
      "board_relation_mkw4cgcj"
    );
    console.log(Supplier, "Supplier");
    if (!!Supplier) {
      const SuppliedItemId = await getSpecificItemUsingColumnValue(
        18040007011,
        "name",
        Supplier
      );

      if (!!SuppliedItemId?.id) {
         const s = JSON.stringify(
          `{"text_mkwar0b7": "${itemId}-${parentName}"}`
        );
       const createdSubitem = await createSubitemMutation(
       SuppliedItemId.id,
          `${parentName}-${subitemName}`,
          s
        );
        console.log(Subitems, "Subitems");
      } else {
        const itemCreated = await createItem(
          18040007011,
          "topics",
          {},
          Supplier
        );
        console.log(itemCreated, "item crea");
        const s = JSON.stringify(
          `{"text_mkwar0b7": "${itemId}-${parentName}"}`
        );
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
    // const {url,name} = await getFileUrl(itemId, "file_mkw3gzhc");
    // console.log(url, "urlllll");
    // parseCsvFromUrl(url,name,boardId,itemId);
    res.send("ok");
  } catch (err) {
    console.log(err, "err");
  }
});
app.listen(8080, () => {
  console.log("serverr runnng");
});
