const {
  getSubitemDetails,
  createItemProcurement,
  createSubitemMutationProcurement,
  UpdateSubitemQuantity,
  checkItemsExistsorNot,
  getProcurementSubitemDetails,
  getSubItems,
  getColumnValue,
  getSpecificItemUsingColumnValue
} = require("../Services/mondayService");

/**
 * Controller: SubItemController
 * Purpose: Handles subitem creation and synchronization between source and Procurement boards in Monday.com
 */
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

    /** Board and column IDs */
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
    const rawMaterialListBoardId = 18015882243;
    const rawMaterialConnectColumnId = "board_relation_mkx7t29d";

    /** Fetch subitem details from Monday.com */
    const itemData = await getSubitemDetails(subitemId, connectedColumnId);
    if (!itemData) {
      return res.status(404).json({ message: "No subitem details found" });
    }

    /** Extract key details from parent item */
    const boardName = itemData.parent_item?.board?.name || "";
    const parentName = itemData.parent_item?.name || "";
    const groupName = itemData.parent_item?.group?.title || "";
    const joineryName = itemData.name || "";
    const sourceParentId = itemData.parent_item?.id || "";

    console.log("boardName:", boardName);
    console.log("parentName:", parentName);
    console.log("groupName:", groupName);
    console.log("joineryName:", joineryName);
    console.log("sourceParentId:", sourceParentId);

    /** Generate item name with today's date */
    const date = new Date();
    const today = `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
    const itemName = `${boardName} - ${today}`;
    console.log("itemName:", itemName);

    /** Get job code value from subitem */
    const jobCode = await getColumnValue(subitemId, "text_mkwtxm06");

    /** Check if procurement item already exists, else create it */
    let itemId = await checkItemsExistsorNot(newProcurementBoardId, itemName);
    console.log("Parent Item ID (before create):", itemId);

    if (!itemId) {
      console.log("Parent item not found. Creating new one...");
      itemId = await createItemProcurement(newProcurementBoardId, itemName);
      console.log("✅ Item created in Procurement board:", itemId);

      // Validate and wait before creating subitems
      if (!itemId || isNaN(Number(itemId))) {
        throw new Error("Invalid itemId returned from createItemProcurement");
      }

      console.log("🕐 Waiting 2s for item registration...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    /** Process linked subitems */
    const linkedItems = itemData.column_values?.[0]?.linked_items || [];
    console.log("Linked Items:", linkedItems);

    if (!linkedItems.length) {
      console.warn("⚠️ No linked subitems found. Skipping subitem creation.");
      return res.status(200).json({ message: "No linked subitems found", itemId });
    }

    const createdSubitems = [];

    for (const linked of linkedItems) {
      const subItemName = linked.name;
      const rawItemId = await getSpecificItemUsingColumnValue(
        rawMaterialListBoardId,
        "name",
        subItemName
      );

      console.log("Raw material item ID for", subItemName, ":", rawItemId);

      const subId = await createSubitemMutationProcurement(
        itemId,
        subItemName,
        subLevelColumnId,
        groupName,
        subUnitColumnId,
        parentName,
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
        jobCode,
        boardName,
        rawMaterialConnectColumnId,
        rawItemId
      );

      console.log(`✅ Subitem created under parent ${itemId}: ${subItemName} (${subId})`);
      createdSubitems.push(subId);
    }

    return res.status(200).json({
      message: "Procurement item and subitems created successfully",
      itemId,
      createdSubitems,
    });

  } catch (err) {
    console.error("❌ Error in SubItemController:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

module.exports = { SubItemController };
