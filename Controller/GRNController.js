const {
  getItemsDetails,
  changeColumnValue
} = require("../Services/GRNService");
const initMondayClient = require("monday-sdk-js");
const mondayClient = initMondayClient();
const GRNController = async (req, res) => {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
  try {
    const payload = req.body;
    const inputFields = payload?.payload?.inputFields || {};
    const itemId = inputFields.itemId;

    const GRNBoardId = 18101653253;
    const NewProcurementManagerSubBoardId = 18020417946;
    const POTrackerSubBoardId = 18073631635;

    console.log("Received itemId:", itemId);
    if (!itemId) {
      return res.status(400).json({ message: "Missing input fields" });
    }

    /** 🔹 Fetch item details from Monday.com */
    const columnData = await getItemsDetails(itemId);
    console.log("Fetched subitem details:", columnData);

    /** 🔹 GRN Column mapping */
    const GRNColumnMapping = {
      "Project Name": "text_mkwjk77m",
      "Job Code": "text_mkwtgbc9",
      "Unit": "dropdown_mkwpz3qc",
      "Joinery Type": "dropdown_mkwp9kh2",
      "Level": "dropdown_mkwp9kh0",
      "Source Subitem ID": "text_mkwpkhv2",
      "Source Parent ID": "text_mkwpfgxe",
      "Requested Qty.": "numeric_mkx75d7e",
      "New Procurement Manager": "board_relation_mkta9sv5",
      "PO Tracker": "board_relation_mkwchz8t",
      "Supplier Name": "text_mkxh3nwv",
      "Link": "link_mkxf25sw",
      "PO Tracker Subitem Link": "link_mkxjwbf6",
      "New Procurement Manager Subitem Link": "link_mkxjbbnt"
    };

    /** 🔹 Prepare column values */
    const columnValues = {};

    for (const [key, columnId] of Object.entries(GRNColumnMapping)) {
      const value = columnData[key] || "";

      // 🔸 Handle board_relation columns
      if (key === "New Procurement Manager" || key === "PO Tracker") {
        // Ensure value is numeric (ID)
        if (value) {
          columnValues[columnId] = { item_ids: [parseInt(value)] };
        }
      }

      // 🔸 Handle source "Link" (points to originating subitem)
      else if (key === "Link") {
        const projectSourceBoardId = columnData["Source Board Id"];
        const projectSourceSubitemId = columnData["Source Subitem ID"];
        const itemName = columnData["Item Name"];

        if (projectSourceBoardId && projectSourceSubitemId) {
          columnValues[columnId] = {
            url: `https://sk-group-force.monday.com/boards/${projectSourceBoardId}/pulses/${projectSourceSubitemId}`,
            text: itemName || "View Source Item"
          };
        }
      }

      // 🔸 Handle "PO Tracker Subitem Link"
      else if (key === "PO Tracker Subitem Link") {
        const newProcurementSubitemId = columnData["New Procurement Subitem Id"];
        const itemName = columnData["Item Name"];
        if (newProcurementSubitemId) {
          columnValues[columnId] = {
            url: `https://sk-group-force.monday.com/boards/${POTrackerSubBoardId}/pulses/${newProcurementSubitemId}`,
            text: itemName || "View PO Tracker Subitem"
          };
        }
      }

      // 🔸 Handle "New Procurement Manager Subitem Link"
      else if (key === "New Procurement Manager Subitem Link") {
        const newProcurementSubitemId = columnData["New Procurement Subitem Id"];
        const itemName = columnData["Item Name"];
        if (newProcurementSubitemId) {
          columnValues[columnId] = {
            url: `https://sk-group-force.monday.com/boards/${NewProcurementManagerSubBoardId}/pulses/${newProcurementSubitemId}`,
            text: itemName || "View Procurement Manager Subitem"
          };
        }
      }

      // 🔸 Default for other fields
      else {
        columnValues[columnId] = value;
      }
    }

    /** 🔹 Create the GraphQL mutation */
    const mutation = `
      mutation {
        create_item(
          board_id: ${GRNBoardId},
          item_name: "${columnData["Item Name"] || "New GRN Item"}",
          column_values: ${JSON.stringify(JSON.stringify(columnValues))},
          create_labels_if_missing: true
        ) {
          id
          name
        }
      }
    `;

    console.log("🧩 create_item mutation:", mutation);

    /** 🔹 Execute mutation */
    const result = await mondayClient.api(mutation);
    const createdItem = result?.data?.create_item;

    console.log("✅ GRN item created successfully:", createdItem);

    /** 🔹 Final response */
    return res.status(200).json({
      message: "GRN item created successfully",
      createdItem,
      mappedData: columnValues
    });

  } catch (err) {
    console.error("❌ Error in GRNController:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { GRNController };
