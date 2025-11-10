const initMondayClient = require("monday-sdk-js");
const mondayClient = initMondayClient();
async function getItemsDetails(itemId) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
     const query = `query {
    items(ids: ${itemId}) {
      id
      name
      parent_item {
        id
        name
      }
      column_values {
        column {
          title
        }
        text
      }
    }
  }`;

  try {
    const res = await mondayClient.api(query);
    const item = res?.data?.items?.[0];

    if (!item) throw new Error("Item not found.");

    // Build a key-value map from column titles and their text values
    const columnData = {};
    item.column_values.forEach(col => {
      columnData[col.column.title] = col.text || "";
    });

    // Add required mappings
    columnData["PO Tracker Subitem Id"] = item.id;
    columnData["Item Name"] = item.name;
    columnData["PO Tracker"] = item.parent_item?.id || "";
    columnData["Supplier Name"] = item.parent_item?.name || "";

    return columnData;
  } catch (err) {
    console.error(
      "❌ Error fetching item details:",
      err.response?.data || err.message
    );
    return { error: err.message };
  }
}

async function createItem(boardId, itemName, columnValues) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );

  const mutation = `
    mutation {
      create_item(
        board_id: ${boardId},
        item_name: "${itemName}",
        column_values: ${JSON.stringify(JSON.stringify(columnValues))}
      ) {
        id
        name
      }
    }
  `;

  try {
    const result = await mondayClient.api(mutation);
    return result.data.create_item;
  } catch (err) {
    console.error("❌ Error creating item:", err.response?.data || err.message);
    throw err;
  }
}

async function changeColumnValue(boardId, itemId, columnId, value) {
  const query = `
    mutation {
      change_simple_column_value(
        board_id: ${boardId},
        item_id: ${itemId},
        column_id: "${columnId}",
        value: "${value}",
        create_labels_if_missing:true
      ) {
        id
        name
      }
    }
  `;
  //console.log(query, "query");
 
  try {
    const response = await mondayClient.api(query);
 
    //console.log("✅ Updated:", response.data.change_column_value);
    return response.data.change_column_value;
  } catch (err) {
    console.error(
      "❌ Error updating column:",
      err.response?.data || err.message
    );
 
    return err;
  }
}

module.exports = {
  getItemsDetails,
  createItem
}