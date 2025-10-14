
 
const initMondayClient = require("monday-sdk-js");
const mondayClient = initMondayClient();
async function getConnectedBoardName(itemId, columnId) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
  const query = `
  query {
 
      items(ids:${itemId}) {
        id
        name
         parent_item{
      name
    }
        column_values(ids: ["${columnId}"]) {  
          id
          type
          ... on BoardRelationValue {
            linked_item_ids
            linked_items {
              id
              name
            }
            display_value
          }
        }
      }
    }
 
  `;
 
  try {
    const res = await mondayClient.api(query);
    console.log(query, "qwue");
 
    return {
      Supplier: res?.data?.items[0]?.column_values[0]?.display_value,
      subitemName: res?.data?.items[0]?.name,
      parentName:res?.data?.items[0]?.parent_item?.name
    };
  } catch (err) {
    console.error(
      "❌ Error updating column:",
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
        value: "${value}"
      ) {
        id
        name
      }
    }
  `;
  console.log(query, "query");
 
  try {
    const response = await mondayClient.api(query);
 
    console.log("✅ Updated:", response.data.data.change_column_value);
    return response.data.data.change_column_value;
  } catch (err) {
    console.error(
      "❌ Error updating column:",
      err.response?.data || err.message
    );
 
    return err;
  }
}
 
async function createItem(boardId, groupId, columnValues = {}, itemName) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
  const query = `
    mutation  {
      create_item (
        board_id: ${boardId},
        group_id: "${groupId}",
        item_name: "${itemName}",
      ) {
        id
      }
    }
  `;
  console.log(query, "query");
  let retries = 5;
  let delay = 1000;
 
  while (retries > 0) {
    try {
      const res = await mondayClient.api(query);
 
      // console.log(res,"RED")
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 429) {
        console.log(`Rate limit hit. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
        retries--;
      } else {
        console.error(
          "Error creating item:",
          err.response?.data || err.message
        );
        break;
      }
    }
  }
  return null;
}
async function generateBoard(name) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
  const query = `
   mutation {
      create_board(
        board_name: "${name}",
        board_kind: public,
        template_id: 12863036
        folder_id:18381371
      ) {
        id
        name
      }
    }
  `;
  console.log(query, "query");
  const response = await mondayClient.api(query);
 
  console.log("✅ Updated:", response?.data);
  return response.data.create_board.id;
}
async function createSubitemMutation(itemId, subitemName, s) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
  console.log(itemId, "asd");
  const mutation = `
    mutation {
      create_subitem (
        parent_item_id: ${itemId},
        item_name: ${subitemName},
        column_values: ${s}  ,
                create_labels_if_missing:true
 
      ) {
        id
      }
    }
  `;
  const d = await mondayClient.api(mutation);
  console.log(d, "ddddd", mutation, "sad");
 
  return d;
}
const LinkConnectedColumnThroughId = async (
  boardId,
  columnId,
  itemId,
  connectedItemId
) => {
  try {
    const monday = initMondayClient();
   monday.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 

    const query = `mutation {
  change_column_value(
    item_id: ${itemId},
    board_id: ${boardId},
    column_id: "${columnId}",
    value: ${JSON.stringify(`{"linkedPulseIds\": [{"linkedPulseId": ${connectedItemId}}]}`)}
  ) {
    id
  }
}
`;

    const response = await monday.api(query);
    console.log(query, "qryeu");
    return response.data;
  } catch (err) {
    console.error("Error getting user metadata:", err);
    throw err;
  }
};
async function deleteSubitem(parentBoardId, subitemName ) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
  const mutation = `
 
query{
  items_page_by_column_values(board_id:${parentBoardId}  columns: [{column_id: "text_mkwar0b7", column_values: ["${subitemName}"]}],
 ){
    items{
id
      name
    }
  }
}
  `;
 
  const d = await mondayClient.api(mutation);
  console.log(d?.data.items_page_by_column_values.items[0].id,"d?.data?.items_page_by_column_values[0]?.items[0]?.",mutation)
  const muitation2=`mutation {
  delete_item(item_id: "${d?.data?.items_page_by_column_values?.items[0]?.id}") {
    id
  }
}`
  const dd=await mondayClient.api(muitation2)
  console.log(dd, "ddddd", mutation, "sad");
 
  return d.data.items_page_by_column_values.items[0];
}
async function changeColumnValue(boardId, itemId, columnId, value) {
  const query = `
    mutation {
      change_simple_column_value(
        board_id: ${boardId},
        item_id: ${itemId},
        column_id: "${columnId}",
        value: "${value}"
      ) {
        id
        name
      }
    }
  `;
  console.log(query, "query");
 
  try {
    const response = await mondayClient.api(query);
 
    console.log("✅ Updated:", response.data.data.change_column_value);
    return response.data.data.change_column_value;
  } catch (err) {
    console.error(
      "❌ Error updating column:",
      err.response?.data || err.message
    );
 
    return err;
  }
}
async function changeLinkColumn(boardId, itemId, columnId, name) {
  const query = `
   mutation {
  change_column_value(
    board_id: ${boardId},
    item_id: ${itemId},
    column_id: "${columnId}",  
    value: ${JSON.stringify(
      `{ "url":\"https://sk-group-force.monday.com/boards/${boardId}","text":"Link to Project ${name}"}`
    )}
  ) {
    id
  }
}
  `;
  console.log(query, "query");
 
  try {
    const response = await mondayClient.api(query);
 
    console.log("✅ Updated:", response.data.change_column_value);
    return response.data.change_column_value;
  } catch (err) {
    console.error(
      "❌ Error updating column:",
      err.response?.data || err.message
    );
 
    return err;
  }
}
async function getSubitemWithParent(subitemId) {
  const mondayClient = initMondayClient();
  TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2MTk4MTAwOCwiYWFpIjoxMSwidWlkIjo4MTkyNjcwMiwiaWFkIjoiMjAyNS0wOS0xNVQxMDo0OToyNC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6Mjk1NTY3MzcsInJnbiI6ImFwc2UyIn0.K9LP7Id84SX4U3mfW_zVd8UxauFI1Cw8nZ_z_evkwYM"; // get from admin > API
 
  mondayClient.setToken(TOKEN);
  const query = `
    query {
      items(ids: ${subitemId}) {
        name
        parent_item {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    }
  `;
  console.log(query, "qweru");
  const res = await mondayClient.api(query);
  console.log(res.data.items[0]);
 
  return res.data.items[0];
}
async function getFileUrl(ITEM_ID, FILE_COLUMN_ID) {
  const mondayClient = initMondayClient();
  TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM";
 
  mondayClient.setToken(TOKEN);
  // 1. Get file asset ID
  const query = `
    query {
      items (ids: [${ITEM_ID}]) {
      name
        column_values(ids: ["${FILE_COLUMN_ID}"]) {
          value
        }
      }
    }`;
  console.log(query, "uery");
 
  const res = await mondayClient.api(query);
  console.log(res.data.items[0], "asd");
 
  const value = JSON.parse(res.data.items[0].column_values[0].value);
  let name = res?.data.items[0]?.name;
  const assetId = value.files[0].assetId;
 
  // 2. Get public URL for asset
  const assetQuery = `
    query {
      assets(ids: [${assetId}]) {
        public_url
      }
    }`;
 
  const assetRes = await mondayClient.api(assetQuery);
 
  return { url: assetRes.data.assets[0].public_url, name: name };
}
 
async function createGroup(groupName, boardId) {
  const mondayClient = initMondayClient();
  TOKEN =
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM";
  mondayClient.setToken(TOKEN);
  const mutation = `
    mutation {
      create_group(board_id:${boardId}, group_name: "${groupName}") {
        id
      }
    }
  `;
  const res = await mondayClient.api(mutation);
  console.log(res, "res");
 
  return res.data.create_group.id;
}
const getSubitemDetails = async (subitemId, connectedColumnId) => {
  try {
    const mondayClient = initMondayClient();
    TOKEN =
      "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM";
    mondayClient.setToken(TOKEN);
    const query = `query {
            items (ids: ${subitemId}) {
                name
                column_values (ids: "${connectedColumnId}") {
                    ... on BoardRelationValue {
                        linked_items {
                            name
                        }
                    }
                }
                parent_item {
                    id
                    name
                    group {
                        title
                    }
                    board {
                        name
                    }
                }
            }
        }`;
 
    console.log("Query", query);
    const res = await mondayClient.api(query);
    console.log(res, "res");
    return res.data.items[0];
  } catch (err) {
    console.error("Error in getSubitemDetails:", err);
  }
};
async function createItemProcurement(boardId, itemName) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
  const query = `
    mutation  {
      create_item (
        board_id: ${boardId},
        item_name: "${itemName}",
      ) {
        id
      }
    }
  `;
  console.log(query, "query");
  let retries = 5;
  let delay = 1000;
 
  while (retries > 0) {
    try {
      const res = await mondayClient.api(query);
 
      // console.log(res,"RED")
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 429) {
        console.log(`Rate limit hit. Retrying in ${delay / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
        retries--;
      } else {
        console.error(
          "Error creating item:",
          err.response?.data || err.message
        );
        break;
      }
    }
  }
  return null;
}
async function createSubitemMutationProcurement(
  itemId,
  subitemName,
  subLevelColumnId,
  groupName,
  subUnitColumnId,
  parentName,
  subitemQuantityId,
  subJoineryColumnId,
  joineryName,
  sourceSubitemColumnId,
  subitemId,
  sourceParentColumnId,
  sourceParentId,
  parentNameCol,
  subitemNameCol,
  BoardIdCol,
  boardIdVal,
  parentIdval
) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
 
  const defaultQuantity = 1;
  console.log(itemId, "asd");
  const mutation = `
    mutation {
      create_subitem (
        parent_item_id: ${itemId},
        item_name: "${subitemName}",
        column_values: ${JSON.stringify(`{"${subLevelColumnId}" : "${groupName}",
          "${subUnitColumnId}" : "${parentName}",
          "${parentNameCol}" : "${parentName}",
          "${sourceParentColumnId}" : "${parentIdval}",
          "${subitemNameCol}" : "${subitemName}",
          "${BoardIdCol}" : "${boardIdVal}",
          "${subitemQuantityId}" : ${defaultQuantity}, "${subJoineryColumnId}" : "${joineryName}","${sourceSubitemColumnId}" : "${subitemId}","${sourceParentColumnId}" : "${sourceParentId}"}`)}, create_labels_if_missing: true
      ) {
        id
      }
    }
  `;
  const d = await mondayClient.api(mutation);
  console.log(d, "ddddd", mutation, "sad");
  return d;
}
 
async function getSubItems(itemId) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
  // const s = JSON.stringify(`{"status": "${subitemStatus}"}`);
  console.log(itemId, "asd");
  const mutation = `
  query{
  items(ids:"${itemId}"){
    subitems{
      id
      name
    }
  }
}
  `;
  const d = await mondayClient.api(mutation);
  console.log(d, "ddddd", mutation, "sad", d.items);
 
  return d.data.items[0].subitems;
}
async function getColumnValue(itemId,columnId) {
  mondayClient.setToken(
    "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
  );
  // const s = JSON.stringify(`{"status": "${subitemStatus}"}`);
  console.log(itemId, "asd");
  const mutation = `
 query {
  items(ids: ${itemId}) {
    id
    name
    column_values(ids: ["${columnId}"]) {
      id
      text
     
    }
  }
}
  `;
  const d = await mondayClient.api(mutation);
  console.log(d, "ddddd", mutation, "sad", d?.data?.items);
 
  return d?.data?.items[0]?.column_values[0]?.text;
}
 
const getSpecificItemUsingColumnValue = async (
  boardId,
  columnId,
  columnValue
) => {
  try {
    const monday = initMondayClient();
    monday.setToken(
      "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
    );
 
    const query = `query {
  items_page_by_column_values(
    limit: 50,
    board_id: ${boardId},
    columns: [
      {
        column_id: "${columnId}",
        column_values: ["${columnValue}"]
      }
    ]
  ) {
     items {
      id
     name
 
    }
  }
}
`;
 
    const response = await monday.api(query);
    console.log(query, "asd");
    console.log(response, "asmaskdmasodinasiudnqw2");
    return response?.data?.items_page_by_column_values.items[0];
  } catch (err) {
    console.error("Error getting user metadata:", err);
    throw err;
  }
};
const checkItemsExistsorNot = async (boardId, itemName) => {
  try {
    const monday = initMondayClient();
    monday.setToken("eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
); // replace with your actual API token
 
 
 
    // do {
      const query = `query {
        items_page_by_column_values(
          limit: 50,
          board_id: ${boardId},
          columns: [{ column_id: "name", column_values: ["${itemName}"] }]
        ) {
          cursor
          items {
            id
            name
          }
        }
      }`;
 
      const response = await monday.api(query);
      console.log(query,"queryyyeryyer")
      console.log(response?.data,"= response?.data?.items_page_by_column_values")
      const pageData = response?.data?.items_page_by_column_values?.items[0]?.id;
 
    //   if (!pageData) break;
 
    //   // const matched = pageData.items?.find(
    //   //   (item) => item.name?.trim().toLowerCase() === itemName.trim().toLowerCase()
    //   // );
 
    //   // if (matched) {
    //   //   foundItem = matched;
    //   //   break;
    //   // }
 
    //   cursor = pageData.cursor; // only continue if there’s a next page
    // }
    // while (cursor && !foundItem);
 
    return pageData || null;
  } catch (err) {
    console.error("Error checking item existence:", err);
    throw err;
  }
};
 
async function UpdateSubitemQuantity(boardId, itemId, quantity=0,subLevelColumnId,groupName,subJoineryColumnId,parentName,subQuantityColumnId) {
  console.log(quantity,"uqnwqeq")
  const level = await getProcurementSubitemDetails(itemId, subLevelColumnId);
  const joineryType = await getProcurementSubitemDetails(itemId, subJoineryColumnId);
 
  const query = `
   mutation {
  change_multiple_column_values(
    board_id: ${boardId},
    item_id: ${itemId},
        column_values: ${JSON.stringify(`{"${subLevelColumnId}" : "${groupName}","${subJoineryColumnId}" : "${parentName}","${subQuantityColumnId}" : ${quantity}}`)}, create_labels_if_missing: true
   
  ) {
    id
  }
}
  `;
  console.log(query, "query");
 
  try {
        const monday = initMondayClient();
 
        monday.setToken("eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM")
 
    const response = await monday.api(query);
 
    console.log("✅ Updated:", response.data);
    return response.data;
  } catch (err) {
    console.error(
      "❌ Error updating column:",
      err.response?.data || err.message
    );
 
    return err;
  }
}
 
const getProcurementSubitemDetails = async (subitemId, columnId) => {
  try {
    const mondayClient = initMondayClient();
    TOKEN =
      "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM";
    mondayClient.setToken(TOKEN);
    const query = `query {
            items (ids: ${subitemId}) {
                column_values (ids: "${columnId}") {
                   text
            }
          }
        }`;
 
    console.log("Query", query);
    const res = await mondayClient.api(query);
    console.log(res.data?.items[0]?.column_values, "res");
    return res.data.items[0].column_values[0].text;
  } catch (err) {
    console.error("Error in getSubitemDetails:", err);
  }
};
 const checkSubitemExistsOrNot = async (itemId, subitemName) => {
  try {
    const monday = initMondayClient();
    monday.setToken(      "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjU2NjAyNTkxOCwiYWFpIjoxMSwidWlkIjo3Nzg4NDU5NSwiaWFkIjoiMjAyNS0wOS0yNFQxMjo0OTowMC4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6NDg3MTQ0MywicmduIjoidXNlMSJ9.XIF97XcTf_3x7XOGiS251ZxxPeP55Q7BaSu5IQ97fzM"
); // replace with your actual API token
 
    const query = `query {
      items(ids: ${itemId}) {
        subitems {
          id
          name
        }
      }
    }`;
 
    const response = await monday.api(query);
    const subitems = response?.data?.items?.[0]?.subitems || [];
 
    // Find the subitem that matches the given name (case-insensitive)
    const matchedSubitem = subitems.find(
      (sub) => sub.name?.trim().toLowerCase() === subitemName.trim().toLowerCase()
    );
 
    return matchedSubitem ? matchedSubitem.id : null;
  } catch (err) {
    console.error("Error checking subitem existence:", err);
    throw err;
  }
};
 
module.exports = {
  getConnectedBoardName,
  changeColumnValue,
  getSubitemWithParent,
  getFileUrl,
  createItem,
  createSubitemMutation,
  createGroup,
  generateBoard,
  changeLinkColumn,
  getSubitemDetails,
  createItemProcurement,
  createSubitemMutationProcurement,
  getSpecificItemUsingColumnValue,
  getSubItems,deleteSubitem,getColumnValue,
  checkItemsExistsorNot,
  UpdateSubitemQuantity,
  checkSubitemExistsOrNot,
  getProcurementSubitemDetails,
  LinkConnectedColumnThroughId
 
};
