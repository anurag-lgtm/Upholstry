const initMondayClient = require("monday-sdk-js");
const mondayClient = initMondayClient();
async function getItemsSubitemsIds(itemId) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
    const query = `query{
                        items(ids: ${itemId}){
                            subitems{
                            id
                            }
                        }
                    }
`;
 
  try {
    const res = await mondayClient.api(query);
    const subitemIds = res?.data?.items[0]?.subitems;
    //console.log(query, "qwue");
 
    return subitemIds;
  } catch (err) {
    console.error(
      "❌ Error data not found column:",
      err.response?.data || err.message
    );
    return err;
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
  getItemsSubitemsIds,
  changeColumnValue
}