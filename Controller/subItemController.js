const {
  getSubitemDetails,
  createItemProcurement,
  createSubitemMutationProcurement,
  UpdateSubitemQuantity,
  checkItemsExistsorNot,
  getProcurementSubitemDetails
} = require("../Services/mondayService");
 
const SubItemController = async (req, res) => {
  try {
    const payload = req.body;
    const inputFields = payload?.payload?.inputFields || {};
 
    const subitemId = inputFields.itemId;
    const subBoardId = inputFields.boardId;
    const connectedColumnId = "board_relation_mkw8n6at";
 console.log("Received subitemId:", subitemId);
 console.log("Received connectedColumnId:", connectedColumnId);
    if (!subitemId || !connectedColumnId) {
      return res.status(400).json({ message: "Missing input fields" });
    }
 
    // Board and column IDs
    const newProcurementBoardId = 18020417927;
    const subLevelColumnId = "dropdown_mkwegdzv";
    const subUnitColumnId = "dropdown_mkwer2p0";
    const subJoineryColumnId = "dropdown_mkwp92gh";
    const sourceSubitemColumnId = "text_mkwpp8vf";
    const sourceParentColumnId = "text_mkwpt6dn";
    const sourceParentNameColumnId = "text_mkwpkbra";
    const sourceSubItemNameColumnId = "text_mkwp3gpc";
    const sourceBoardColumnId = "text_mkwpy55x";
    const subQuantityColumnId = "numeric_mkw44src";
    const subitemBoardId = "18020417946";
 
    // Fetch subitem details
    const itemData = await getSubitemDetails(subitemId, connectedColumnId);
    if (!itemData) {
      return res.status(404).json({ message: "No subitem details found" });
    }
 
    // Build item name for Procurement board
    const boardName = itemData.parent_item?.board?.name || "";
    const parentName = itemData.parent_item?.name || "";
    const groupName = itemData.parent_item?.group?.title || "";
    const joineryName = itemData.name || "";
    const sourceParentId = itemData.parent_item?.id || "";
 
    const date = new Date();
    const today = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
    const itemName = `${boardName} - ${today}`;
 
    // Check if the Procurement board item exists
    let itemId = await checkItemsExistsorNot(newProcurementBoardId, itemName);
    console.log(itemId, "Checked itemId");
    
    if (!itemId) {
      itemId = await createItemProcurement(newProcurementBoardId, itemName);
      console.log("Item created:", itemId);
    }
 
    // Process linked items (subitems)
    console.log(itemData, "itemData", itemData.column_values);
    const linkedItems = itemData.column_values?.[0]?.linked_items || [];
    const createdSubitems = [];
 console.log(linkedItems, "linkedItems"); 
    for (const linked of linkedItems) {
      const subItemName = linked.name;
      let subId = await checkItemsExistsorNot(subitemBoardId, subItemName);
 console.log(subId, "subId after check");
      if (subId) {
        // Update quantity if subitem exists
        const currentQuantity = await getProcurementSubitemDetails(subId, subQuantityColumnId);
        const updatedQuantity = currentQuantity + 1;
        await UpdateSubitemQuantity(subitemBoardId,subId, updatedQuantity,subQuantityColumnId,"","","","");
        console.log(`Updated quantity for subitem ${subItemName} to ${updatedQuantity}`);
      } else {
        // Create new subitem if it doesn't exist
        subId = await createSubitemMutationProcurement(
          itemId,
          subItemName,
          subLevelColumnId,
          groupName,
          subUnitColumnId,
          parentName,
          subQuantityColumnId,
          subJoineryColumnId,
          joineryName,
          sourceSubitemColumnId,
          subitemId,
          sourceParentColumnId,
          sourceParentId,    
          sourceParentNameColumnId,
          sourceSubItemNameColumnId,
          sourceBoardColumnId,
          subBoardId,
          sourceParentId
        );
        console.log(`Subitem created: ${subItemName}`);
      }
 
      createdSubitems.push(subId);
    }
 
    return res.status(200).json({
      message: "Success",
      itemId,
      createdSubitems,
    });
 
  } catch (err) {
    console.error("Error in SubItemController:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
 
module.exports = { SubItemController };
 