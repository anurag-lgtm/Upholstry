const {
  getItemsSubitemsIds,
  changeColumnValue
} = require("../Services/statusChangeService");

const StatusChangeController = async (req, res) => {
  try {
    const payload = req.body;
    const inputFields = payload?.payload?.inputFields || {};

    const itemId = inputFields.itemId;
    const subBoardId = 18073631635;
    const subStatusColumnId = "color_mkwjngbt";
    const statusValue = "Create in GRN";

    console.log("Received itemId:", itemId);
    if (!itemId) {
      return res.status(400).json({ message: "Missing input fields" });
    }

    /** Fetch subitem details from Monday.com */
    const subitemIds = await getItemsSubitemsIds(itemId);
    console.log("subitem ids are:", subitemIds);

    if (!subitemIds || subitemIds.length === 0) {
      return res.status(404).json({ message: "No subitems found" });
    }

    /** Loop through each subitem and update the status column */
    for (const subitem of subitemIds) {
      const subitemId = subitem.id;
      console.log(`Updating subitem ${subitemId}...`);
      await changeColumnValue(subBoardId, subitemId, subStatusColumnId, statusValue);
      console.log(`Subitem ${subitemId} updated successfully.`);
    }

    /** Final response */
    return res.status(200).json({
      message: "Success",
      updatedSubitems: subitemIds.map(s => s.id),
    });

  } catch (err) {
    console.error("Error in StatusChangeController:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { StatusChangeController };
