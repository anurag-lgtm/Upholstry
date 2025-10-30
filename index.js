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
  checkItemsExistsorNot,
  getColumnValueWithName,
  UpdateSubitemQuantity,
  changeColumnValue,
  getSubItemsBoardId,
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
app.post("/GRN", async (req, res) => {
  try {
    console.log("GRNRNRRR")
    const { itemId, boardId } = req.body.payload.inputFields;
    const SitemId = await getColumnValue(itemId, "text_mkwp8vq6");
    const SName = await getColumnValue(itemId, "text_mkwpdykv");
    const SSitemId = await getColumnValue(itemId, "text_mkwpkf5r");
    const TotalQty = await getColumnValue(itemId, "text_mkwcswqw");
    const SBoardId = await getColumnValue(itemId, "text_mkwpmp6x");
    const ProjectName = await getColumnValue(itemId, "text_mkwjwf3b");
    const JobId = await getColumnValue(itemId, "text_mkwtpsp8");
    const MaterialName = await getColumnValueWithName(itemId, "text_mkwpmp6x");

    const Material = await checkItemsExistsorNot(18101653253, MaterialName);
    console.log(Material,"ASDASDASD")
    if (Material) {
      const allsubitem = await getSubItems(Material);
      console.log(allsubitem, "allsubitemallsubitem");
      const existingSubitem = allsubitem.find((subitem) => {
        return subitem.name === ProjectName;
      });
      if (existingSubitem) {
        console.log("Subitem already exists. Skipping creation.");
        const updatedQuantity =
          parseInt(TotalQty) +
          parseInt(
            await getColumnValue(existingSubitem.id, "numeric_mkwcx8b1")
          );
        const updateQuantity = await UpdateSubitemQuantity(
          existingSubitem.id,
          "numeric_mkwcx8b1",
          updatedQuantity
        );

        return res.send("ok");
      } 
      else {
        const createSubitem = await createSubitemMutation(
          Material,
          `"${ProjectName}"`,
          JSON.stringify(`{
      "text_mkwtm5tq":"${JobId}",
      "numeric_mkwcx8b1":"${TotalQty || ""}",
      "text_mkwt2sf3":"${SBoardId}",
      "text_mkwt35nf":"${SitemId}",
      "text_mkwtznj3":"${SSitemId}"
      
      }`)
        );
      }
    } else {
      const createItem2 = await createItem(18101653253, "topics", {}, SName);
      console.log(createItem2, "createItem2");
      const createSubitem = await createSubitemMutation(
        createItem2.create_item.id,
        `"${ProjectName}"`,
        JSON.stringify(`{
    "text_mkwtm5tq":"${JobId}",
    "numeric_mkwcx8b1":"${TotalQty || ""}",
        "text_mkwt2sf3":"${SBoardId}",
      "text_mkwt35nf":"${SitemId}",
      "text_mkwtznj3":"${SSitemId}"
    
    
    
    }`)
      );
      // const d = await LinkConnectedColumnThroughId(
      //   18101653253,
      //   "board_relation_mkwpxmsm",
      //   createItem2.create_item.id,
      //   SitemId
      // );
    }
    res.send("ok");
  } catch (err) {
    console.log(err, "err");
    res.send("ok");
  }
});
app.post("/linkBack", async (req, res) => {
try{
    const { itemId, boardId } = req.body.payload.inputFields;
  console.log("linkBackendpoint",itemId,boardId);
  const person = await getColumnValue(itemId, "color_mktapjab");
  const qtyOrderd = await getColumnValue(itemId, "numeric_mktafn47");
  const recivedBy = await getColumnValue(itemId, "color_mktapjab");
  const suby=await getSubItems(itemId)
  suby.forEach(async(s)=>{
    const sourceParentItemId = await getColumnValue(s.id, "text_mkwt35nf");
    console.log(sourceParentItemId,"asourqceParentItemId")
    const subBoardId=await getSubItemsBoardId(sourceParentItemId)
    const tBoardId=await getColumnValue(s.id,"text_mkwt2sf3")
    const subitemId=await getColumnValue(s.id,"text_mkwtznj3")

      
      const up=await changeColumnValue(subBoardId,subitemId,"color_mkwxn6pm",person)
      console.log(up,"upupupup")

  })
  res.send("ok")
}
catch(err){ 
  console.log(err,"err");
  res.send("ok")
}
})
const processSubitems=async(itemId,CurrsubitemName,fields)=>{
   const { Supplier, subitemName, parentName, parentId } =
      await getConnectedBoardName(itemId, "board_relation_mkw4cgcj");
    const ssId = await getColumnValue(itemId, "text_mkwpp8vf");
    const ssName = await getColumnValue(itemId, "text_mkwp3gpc");
    const sbId = await getColumnValue(itemId, "text_mkwpy55x");
    const spId = await getColumnValue(itemId, "text_mkwpt6dn");
    const spName = await getColumnValue(itemId, "text_mkwpkbra");
    const joineryType = await getColumnValue(itemId, "dropdown_mkwp92gh");
    const jobId = await getColumnValue(itemId, "text_mkwt5smm");
    const projectName = await getColumnValue(itemId, "text_mkwjfrjn");
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
          // console.log(joineryType, level, "--------------------");
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
            "${fields["sourceParentId"]}": "${spId}",
            "${fields["sourceBoardId"]}": "${sbId}",
            "${fields["sourceSubitemId"]}": "${ssId}",
            "${fields["sourceSubitemName"]}": "${ssName}",
            "${fields["sourceParentName"]}": "${spName}",
            "${fields["jobId"]}": "${jobId || ""}",
            "${fields["projectName"]}": "${projectName}",
            "${fields["joineryType"]}": "${joineryType}",
            
            "dropdown_mkwg3158":${JSON.stringify({
              labels: formatValueForDropdown(level),
            })}, "status":"${
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
            `"${subitemName}"`,
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
            "${fields["sourceParentId"]}": "${spId}",
            "${fields["sourceBoardId"]}": "${sbId}",
            "${fields["sourceSubitemId"]}": "${ssId}",
            "${fields["sourceSubitemName"]}": "${ssName}",
            "${fields["sourceParentName"]}": "${spName}",
                 "${fields["jobId"]}": "${jobId}",
            "${fields["projectName"]}": "${projectName}",
              "${fields["joineryType"]}": "${joineryType}",
            "dropdown_mkwg3158":${JSON.stringify({
              labels: formatValueForDropdown(level),
            })}, "status":"${
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
            `"${subitemName}"`,
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
            "${fields["sourceParentId"]}": "${spId}",
            "${fields["sourceBoardId"]}": "${sbId}",
            "${fields["sourceSubitemId"]}": "${ssId}",
            "${fields["sourceSubitemName"]}": "${ssName}",
            "${fields["sourceParentName"]}": "${spName}",
                 "${fields["jobId"]}": "${jobId}",
            "${fields["projectName"]}": "${projectName}",
              "${fields["joineryType"]}": "${joineryType}"
            ,"dropdown_mkwg3158":${JSON.stringify({
              labels: formatValueForDropdown(level),
            })}, "status":"${
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
          itemCreated.create_item.id,
          `"${subitemName}"`,
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
}


// const linkBack=await changeColumnValue(1232,123123,12123,s)
app.post("/Upload", async (req, res) => {
  const { itemId, boardId } = req.body.payload.inputFields;
  // res.send("ok")
  try {
    const { url, name } = await getFileUrl(itemId, "file_mkvwbjzy");
    console.log(url, "urlllll");
    parseCsvFromUrl(url, name, boardId, itemId); 
    res.send("ok");
   setTimeout(async () => {
     changeStatusToDone = await changeColumnValue(
      boardId,
      itemId, "color_mkw81xpe",
     "Project Created"
    );
    },5000) 
   
  } catch (err) {
    console.log(err, "err");
  }
});
app.post("/checkUpdate", async (req, res) => {
  const { itemId, boardId } = req.body.payload.inputFields;
  console.log(req.body.payload);
  try {
    // res.send("ok")
    const fields = {
      sourceSubitemId: "text_mkwpkf5r",
      sourceParentId: "text_mkwp8vq6",
      sourceSubitemName: "text_mkwpdykv",
      sourceParentName: "text_mkwp4ztr",
      sourceBoardId: "text_mkwpmp6x",
      projectName: "text_mkwjwf3b",
      jobId: "text_mkwtpsp8",
      joineryType:"dropdown_mkwpar7c"

    };

    console.log("ASDAS");
    const subitemBoardId = "18073631635";
    const subitemS = await getSubItems(itemId);
    res.send("ok");
   for (let i=0;i<subitemS.length;i++){
    const subitem=subitemS[i]
    const process=await processSubitems(subitem.id,subitem.name,fields)
    console.log(process,"subitemssubitemssubitemssubitems")  
   }
  } catch (err) {
    res.send("ok");
    console.log(err, "err");
  }
});
app.listen(8080, () => {
  console.log("serverr runnng");
});
